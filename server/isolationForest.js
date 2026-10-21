/**
 * Isolation Forest Implementation in pure JavaScript
 * Based on Liu, Ting, Zhou (2008) "Isolation Forest"
 */

class IsolationTreeNode {
  constructor(size) {
    this.size = size;
    this.splitFeature = null;
    this.splitValue = null;
    this.left = null;
    this.right = null;
  }
}

// Average path length of unsuccessful search in BST
function c(n) {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  const eulerMascheroni = 0.5772156649;
  return 2 * (Math.log(n - 1) + eulerMascheroni) - (2 * (n - 1)) / n;
}

class IsolationTree {
  constructor(maxDepth) {
    this.maxDepth = maxDepth;
    this.root = null;
  }

  fit(X, currentDepth = 0) {
    const numSamples = X.length;
    if (currentDepth >= this.maxDepth || numSamples <= 1) {
      return new IsolationTreeNode(numSamples);
    }

    const numFeatures = X[0].length;
    // Find features that have variance
    const candidateFeatures = [];
    for (let f = 0; f < numFeatures; f++) {
      let min = X[0][f];
      let max = X[0][f];
      for (let i = 1; i < numSamples; i++) {
        if (X[i][f] < min) min = X[i][f];
        if (X[i][f] > max) max = X[i][f];
      }
      if (max > min) {
        candidateFeatures.push({ f, min, max });
      }
    }

    if (candidateFeatures.length === 0) {
      return new IsolationTreeNode(numSamples);
    }

    // Pick random feature
    const chosen = candidateFeatures[Math.floor(Math.random() * candidateFeatures.length)];
    const splitValue = chosen.min + Math.random() * (chosen.max - chosen.min);

    const leftX = [];
    const rightX = [];
    for (let i = 0; i < numSamples; i++) {
      if (X[i][chosen.f] < splitValue) {
        leftX.push(X[i]);
      } else {
        rightX.push(X[i]);
      }
    }

    const node = new IsolationTreeNode(numSamples);
    node.splitFeature = chosen.f;
    node.splitValue = splitValue;
    node.left = this.fit(leftX, currentDepth + 1);
    node.right = this.fit(rightX, currentDepth + 1);
    return node;
  }

  pathLength(x, node, currentDepth = 0) {
    if (!node.left || !node.right) {
      return currentDepth + c(node.size);
    }
    if (x[node.splitFeature] < node.splitValue) {
      return this.pathLength(x, node.left, currentDepth + 1);
    } else {
      return this.pathLength(x, node.right, currentDepth + 1);
    }
  }
}

export class IsolationForest {
  constructor(nTrees = 50, subSampleSize = 128) {
    this.nTrees = nTrees;
    this.subSampleSize = subSampleSize;
    this.trees = [];
    this.sampleSize = 0;
  }

  fit(X) {
    if (!X || X.length === 0) return;
    this.sampleSize = X.length;
    const subSize = Math.min(X.length, this.subSampleSize);
    const maxDepth = Math.ceil(Math.log2(Math.max(subSize, 2)));

    this.trees = [];
    for (let t = 0; t < this.nTrees; t++) {
      // Subsample with or without replacement
      const subX = [];
      for (let i = 0; i < subSize; i++) {
        const randIdx = Math.floor(Math.random() * X.length);
        subX.push(X[randIdx]);
      }
      const tree = new IsolationTree(maxDepth);
      tree.root = tree.fit(subX, 0);
      this.trees.push(tree);
    }
  }

  score(x) {
    if (this.trees.length === 0 || this.sampleSize <= 1) return 0.5;
    let totalPath = 0;
    for (const tree of this.trees) {
      totalPath += tree.pathLength(x, tree.root, 0);
    }
    const avgPath = totalPath / this.trees.length;
    const cN = c(this.sampleSize);
    if (cN === 0) return 0.5;

    // Standard Isolation Forest anomaly score: s(x, n) = 2^(- E(h(x)) / c(n))
    // Score ~ 1: highly anomalous
    // Score < 0.5: normal
    const score = Math.pow(2, -avgPath / cN);
    return Math.min(Math.max(score, 0), 1);
  }
}
