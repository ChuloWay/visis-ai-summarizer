import { Logger } from '@nestjs/common';
import { TfIdf } from 'natural';
import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';
var synonyms = require('synonyms');
import { stopWords } from './stopwords';

export class SummarizerUtil {
  private logger = new Logger(SummarizerUtil.name);
  private model: any;

  constructor() {
    this.loadModel();
  }

  /**
   * Loads the Universal Sentence Encoder model.
   * The model is used for embedding sentences into a high-dimensional vector space.
   * This allows the comparison of sentence meanings by computing the similarity between vectors.
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
   * Ensures the model is loaded before any operations that require it.
   * If the model is not already loaded, it loads it.
   * This method acts as a safeguard to avoid using an uninitialized model.
   * @private
   * @returns {Promise<void>}
   */
  private async ensureModelLoaded(): Promise<void> {
    if (!this.model) {
      this.model = await use.load();
    }
  }

  /**
   * Generates a summary for the given text.
   * This method processes the input text to extract key sentences that represent the overall content.
   * The summary length is determined by a combination of sentence ranking algorithms and heuristics.
   * @param {string} text - The text to summarize.
   * @param {number} maxSentences - The maximum number of sentences to include in the summary.
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
   * Splits the input text into individual sentences.
   * This is done by matching the text against sentence-ending punctuation like periods, exclamation marks, and question marks.
   * @private
   * @param {string} text - The text to split into sentences.
   * @returns {string[]} An array of sentences extracted from the text.
   */
  private splitIntoSentences(text: string): string[] {
    return text.match(/[^\.!\?]+[\.!\?]+/g) || [];
  }

  /**
   * Calculates the frequency of each word in the text, excluding common stop words.
   * The frequency is represented as a map where the key is the word and the value is the count of occurrences.
   * @private
   * @param {string} text - The text to analyze for word frequency.
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
   * Post-processes the generated summary to remove redundancy, correct capitalization, and add transitions.
   * This step enhances the readability and coherence of the summary.
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
   * Ranks sentences based on various scoring criteria such as TF-IDF, word frequency, and sentence position.
   * The sentences are then sorted in descending order of their scores, with the most relevant sentences first.
   * @param {string[]} sentences - The sentences to rank.
   * @param {Map<string, number>} wordFrequency - The word frequency map.
   * @param {TfIdf} tfidf - The TF-IDF instance used for ranking.
   * @param {number[]} referenceEmbedding - The reference sentence embedding used to calculate semantic similarity.
   * @returns {Promise<string[]>} A promise that resolves to the ranked sentences.
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
   * Determines if a sentence is likely to be a topic sentence.
   * Topic sentences often introduce a paragraph and provide the main idea.
   * This function gives higher scores to sentences that contain common topic indicators or are positioned early in the text.
   * @private
   * @param {string} sentence - The sentence to evaluate.
   * @param {number} index - The index of the sentence in the text.
   * @returns {number} A score indicating the likelihood that the sentence is a topic sentence.
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

  /**
   * Calculates a score based on whether the sentence contains biographical keywords.
   * Sentences with keywords like "born", "founded", or "died" are more likely to be important in summaries.
   * @private
   * @param {string} sentence - The sentence to evaluate.
   * @returns {number} A score indicating the presence of biographical keywords.
   */
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

  /**
   * Calculates a score for a sentence based on word frequency.
   * Sentences that contain more frequent and significant words (excluding stop words) receive higher scores.
   * @private
   * @param {string} sentence - The sentence to evaluate.
   * @param {Map<string, number>} wordFrequency - A map of word frequencies.
   * @returns {number} A score representing the importance of the sentence based on word frequency.
   */
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

  /**
   * Selects a reference sentence and returns its embedding.
   * The reference sentence is typically the middle sentence in the text and serves as a basis for semantic similarity comparison.
   * @private
   * @param {string[]} sentences - The list of sentences from the text.
   * @returns {Promise<number[]>} The embedding of the reference sentence.
   */
  private async getReferenceEmbedding(sentences: string[]): Promise<number[]> {
    const representativeSentence = sentences[Math.floor(sentences.length / 2)];
    return await this.getEmbedding(representativeSentence);
  }

  /**
   * Generates an embedding (vector representation) for a given sentence.
   * This embedding is used to compare the semantic similarity between sentences.
   * @private
   * @param {string} sentence - The sentence to embed.
   * @returns {Promise<number[]>} The embedding of the sentence.
   */
  private async getEmbedding(sentence: string): Promise<number[]> {
    const embeddings = await this.model.embed([sentence]);
    return embeddings.arraySync()[0];
  }

  /**
   * Calculates a semantic similarity score between a sentence and a reference embedding using cosine similarity.
   * The closer the sentence's embedding is to the reference embedding, the higher the score.
   * @private
   * @param {string} sentence - The sentence to evaluate.
   * @param {number[]} referenceEmbedding - The reference embedding to compare against.
   * @returns {Promise<number>} A score representing the semantic similarity between the sentence and the reference.
   */
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

  /**
   * Replaces words in a sentence with their synonyms to create variety and potentially improve readability.
   * The function prioritizes shorter synonyms that preserve the original meaning of the sentence.
   * @private
   * @param {string} sentence - The sentence to modify.
   * @returns {string} The modified sentence with some words replaced by their synonyms.
   */
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
