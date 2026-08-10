export interface NodeRecencyInfo {
  nodeId: string;
  rank: number; // 1 to 7 (1 = most recent)
  timeAgo: string;
  intensity: 'highest' | 'high' | 'medium' | 'low';
  badgeLabel: string;
  effectiveTime: string;
}

export function getRelativeTime(isoString?: string): string {
  if (!isoString) return "";
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now.getTime() - past.getTime();
  
  if (diffMs < 0) return "Just now"; // Failsafe
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  
  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Extracts any embedded 13-digit timestamp (unix epoch in ms) from uploaded file URLs.
 * If multiple files exist, it returns the latest timestamp.
 */
export function getNodeEffectiveTime(node: any): string {
  let maxTimeMs = 0;

  // Look for 13-digit Unix timestamps (starts with 1, e.g. 1777711766215) in any of the asset URLs
  const urlsToCheck = [
    node.assets?.systemFlowUrl,
    node.assets?.videoUrl,
    node.assets?.deckUrl,
    node.assets?.bgImageUrl
  ].filter(Boolean);

  urlsToCheck.forEach((url: string) => {
    // Matches 13 digits starting with 16, 17, 18, or 19
    const match = url.match(/(1[6-9]\d{11})/);
    if (match) {
      const ts = parseInt(match[1], 10);
      if (!isNaN(ts)) {
        maxTimeMs = Math.max(maxTimeMs, ts);
      }
    }
  });

  // Also factor in the node's textual updatedAt field
  if (node.updatedAt) {
    const updatedAtMs = new Date(node.updatedAt).getTime();
    if (!isNaN(updatedAtMs)) {
      maxTimeMs = Math.max(maxTimeMs, updatedAtMs);
    }
  }

  // Fallback to Epoch if absolutely nothing is found
  if (maxTimeMs === 0) {
    return node.updatedAt || new Date().toISOString();
  }

  return new Date(maxTimeMs).toISOString();
}

/**
 * Computes the recency details for the top 7 recently updated nodes.
 * @param nodes List of all protocols/nodes
 * @returns Map of nodeId to its recency info
 */
export function getRecencyMap(nodes: any[]): Record<string, NodeRecencyInfo> {
  const nodeTimes = (nodes || []).map(n => ({
    node: n,
    effectiveTime: getNodeEffectiveTime(n)
  }));

  const sorted = [...nodeTimes]
    .filter(item => item.node.id)
    .sort((a, b) => new Date(b.effectiveTime).getTime() - new Date(a.effectiveTime).getTime());

  const recencyMap: Record<string, NodeRecencyInfo> = {};
  
  // Take up to top 7
  const top7 = sorted.slice(0, 7);
  
  top7.forEach((item, index) => {
    const rank = index + 1;
    let intensity: 'highest' | 'high' | 'medium' | 'low' = 'low';
    let badgeLabel = "";
    
    if (rank === 1) {
      intensity = 'highest';
      badgeLabel = "★ MOST RECENT";
    } else if (rank <= 3) {
      intensity = 'high';
      badgeLabel = `#${rank} RECENT`;
    } else if (rank <= 5) {
      intensity = 'medium';
      badgeLabel = `#${rank} RECENT`;
    } else {
      intensity = 'low';
      badgeLabel = `RECENT`;
    }
    
    recencyMap[item.node.id] = {
      nodeId: item.node.id,
      rank,
      timeAgo: getRelativeTime(item.effectiveTime),
      intensity,
      badgeLabel,
      effectiveTime: item.effectiveTime
    };
  });
  
  return recencyMap;
}
