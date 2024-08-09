import { Injectable, Logger } from '@nestjs/common';
import { TfIdf } from 'natural';
import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';
// import synonyms from 'synonyms';
var synonyms = require('synonyms');
import { stopWords } from '../stopwords';
import { InjectModel } from '@nestjs/mongoose';
import { Summary, SummaryDocument } from './schema/summary.schema';
import { Model, Types } from 'mongoose';
@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);
  private model: any;

  constructor(
    @InjectModel(Summary.name) private summaryModel: Model<SummaryDocument>,
  ) {
    this.loadModel();
  }

  async create(bookId: Types.ObjectId, summaryText: string): Promise<Summary> {
    const createdSummary = new this.summaryModel({
      book: bookId,
      summary: summaryText,
    });
    return createdSummary.save();
  }

  async update(id: any, summaryText: string): Promise<Summary> {
    return this.summaryModel
      .findByIdAndUpdate(id, { summary: summaryText }, { new: true })
      .exec();
  }

  async delete(id: any): Promise<any> {
    return this.summaryModel.findByIdAndDelete(id).exec();
  }

  /**
   * Asynchronously loads the Universal Sentence Encoder model.
   * @private
   * @returns {Promise<void>}
   */
  private async loadModel(): Promise<void> {
    try {
      this.logger.log('Loading Universal Sentence Encoder model...');
      this.model = await use.load();
      this.logger.log('Model loaded successfully');
    } catch (error) {
      this.logger.error('Error loading model:', error);
      throw error;
    }
  }

  /**
   * Ensures that the model is loaded. If not, loads it.
   * @private
   * @returns {Promise<void>}
   */
  private async ensureModelLoaded(): Promise<void> {
    if (!this.model) {
      this.model = await use.load();
    }
  }

  /**
   * Generates a summary from the input text.
   * @param {string} text - The text to summarize.
   * @param {number} maxSentences - The maximum number of sentences in the summary.
   * @returns {Promise<string>} The generated summary.
   */
  async generateSummary(text: string, maxSentences: number): Promise<string> {
    try {
      await this.ensureModelLoaded();
      const sentences = this.splitIntoSentences(text);
      const wordFrequency = this.calculateWordFrequency(text);
      const tfidf = new TfIdf();
      sentences.forEach((sentence) => tfidf.addDocument(sentence));

      const referenceEmbedding = await this.getReferenceEmbedding(sentences);
      const rankedSentences = await this.rankSentences(
        sentences,
        wordFrequency,
        tfidf,
        referenceEmbedding,
      );

      const summaryLength = Math.min(
        maxSentences,
        Math.max(3, Math.floor(sentences.length * 0.2)),
      );
      const topSentences = rankedSentences.slice(0, summaryLength);

      const sentencesWithSynonyms = topSentences.map((sentence) =>
        this.replaceWithSynonyms(sentence),
      );

      return this.postProcessSummary(sentencesWithSynonyms);
    } catch (error) {
      this.logger.error('Error generating summary:', error.stack);
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Splits the input text into an array of sentences.
   * @private
   * @param {string} text - The text to split.
   * @returns {string[]} An array of sentences.
   */
  private splitIntoSentences(text: string): string[] {
    return text.match(/[^\.!\?]+[\.!\?]+/g) || [];
  }

  /**
   * Calculates the frequency of words in the text, excluding stop words.
   * @private
   * @param {string} text - The text to analyze.
   * @returns {Map<string, number>} A map of word frequencies.
   */
  private calculateWordFrequency(text: string): Map<string, number> {
    const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
    const frequency = new Map<string, number>();
    for (const word of words) {
      if (!stopWords.has(word)) {
        frequency.set(word, (frequency.get(word) || 0) + 1);
      }
    }
    return frequency;
  }

  /**
   * Post-processes the summary by removing redundant sentences, ensuring proper capitalization,
   * and adding transition words.
   * @private
   * @param {string[]} sentences - The sentences to process.
   * @returns {string} The post-processed summary.
   */
  private postProcessSummary(sentences: string[]): string {
    // Remove redundant sentences
    const uniqueSentences = Array.from(new Set(sentences));

    // Remove reference markers and ensure proper capitalization
    const cleanedSentences = uniqueSentences.map((sentence) =>
      sentence.replace(/\[\d+\]/g, '').trim(),
    );

    const capitalizedSentences = cleanedSentences.map(
      (sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1),
    );

    // Add transition words
    const transitionWords = [
      'Moreover',
      'Furthermore',
      'Additionally',
      'In addition',
    ];

    const processedSentences = capitalizedSentences.map((sentence, index) => {
      if (index === 0) return sentence;
      return `${transitionWords[index % transitionWords.length]}, ${
        sentence.charAt(0).toUpperCase() + sentence.slice(1)
      }`;
    });

    return processedSentences.join(' ');
  }

  /**
   * Ranks the sentences based on various scoring criteria.
   * @param sentences - The sentences to rank.
   * @param wordFrequency - The word frequency map.
   * @param tfidf - The TF-IDF instance.
   * @param referenceEmbedding - The reference sentence embedding.
   * @returns A promise that resolves to the ranked sentences.
   */
  private async rankSentences(
    sentences: string[],
    wordFrequency: Map<string, number>,
    tfidf: TfIdf,
    referenceEmbedding: number[],
  ): Promise<string[]> {
    const scores = await Promise.all(
      sentences.map(async (sentence, index) => {
        const tfidfScore = tfidf.tfidf(sentence, index);
        const sentenceScore = this.calculateSentenceScore(
          sentence,
          wordFrequency,
        );
        const embeddingScore = await this.calculateSentenceEmbeddingScore(
          sentence,
          referenceEmbedding,
        );
        const positionScore = 1 / (index + 1);
        const lengthScore = sentence.split(' ').length / 20;
        return {
          sentence,
          score:
            tfidfScore +
            sentenceScore +
            embeddingScore +
            positionScore +
            lengthScore,
        };
      }),
    );
    return scores
      .sort((a, b) => b.score - a.score)
      .map((item) => item.sentence);
  }

  /**
   * Determines if a sentence is a topic sentence.
   * @param sentence - The sentence to check.
   * @param index - The index of the sentence.
   * @returns A score indicating if the sentence is a topic sentence.
   */
  private isTopicSentence(sentence: string, index: number): number {
    const topicIndicators = [
      'is',
      'was',
      'are',
      'were',
      'refers to',
      'defined as',
      'can be described as',
    ];
    const score = topicIndicators.some((indicator) =>
      sentence.toLowerCase().includes(indicator),
    )
      ? 2
      : 0;
    return score + (index === 0 ? 3 : 0);
  }

  private calculateBioScore(sentence: string): number {
    const genericKeywords = [
      'born',
      'birth',
      'died',
      'death',
      'age',
      'founded',
      'established',
      'created',
      'invented',
      'discovered',
      'developed',
      'introduced',
      'is a',
      'was a',
      'known for',
      'famous for',
    ];
    return genericKeywords.some((keyword) =>
      sentence.toLowerCase().includes(keyword),
    )
      ? 3
      : 0;
  }

  private calculateSentenceScore(
    sentence: string,
    wordFrequency: Map<string, number>,
  ): number {
    const words: string[] = sentence.toLowerCase().match(/\b(\w+)\b/g) || [];
    if (words.length === 0) return 0;

    const score = words.reduce((acc: number, word: string) => {
      return acc + (wordFrequency.get(word) || 0);
    }, 0);

    return score / words.length;
  }

  private async getReferenceEmbedding(sentences: string[]): Promise<number[]> {
    const representativeSentence = sentences[Math.floor(sentences.length / 2)];
    return await this.getEmbedding(representativeSentence);
  }

  private async getEmbedding(sentence: string): Promise<number[]> {
    const embeddings = await this.model.embed([sentence]);
    return embeddings.arraySync()[0];
  }

  private async calculateSentenceEmbeddingScore(
    sentence: string,
    referenceEmbedding: number[],
  ): Promise<number> {
    const sentenceEmbedding = await this.getEmbedding(sentence);
    const referenceTensor = tf.tensor(referenceEmbedding);
    const cosineSimilarity = tf.losses.cosineDistance(
      referenceTensor,
      sentenceEmbedding,
      0,
    );
    return 1 - cosineSimilarity.dataSync()[0];
  }

  private replaceWithSynonyms(sentence: string): string {
    const words = sentence.split(' ');
    const modifiedWords = words.map((word) => {
      const lowerWord = word.toLowerCase();

      if (stopWords.has(lowerWord) || word.length <= 3) return word;

      const synonymObject = synonyms(lowerWord);
      if (synonymObject) {
        const synonymsArray = synonymObject.n || synonymObject.v || [];
        if (synonymsArray.length > 0) {
          // Choose a simpler synonym if available
          const simpleSynonym =
            synonymsArray.find((syn) => syn.length <= 7) || synonymsArray[0];
          return simpleSynonym.charAt(0).toUpperCase() + simpleSynonym.slice(1);
        }
      }

      return word;
    });

    return modifiedWords.join(' ');
  }
}
