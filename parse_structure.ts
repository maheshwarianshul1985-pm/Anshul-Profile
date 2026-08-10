import fs from 'fs';

async function parseStructure() {
  try {
    const url = "https://firestore.googleapis.com/v1/projects/gen-lang-client-0568439716/databases/ai-studio-15655e8c-18ff-4359-b057-60febe5dddfc/documents/portfolio/main";
    const res = await fetch(url);
    if (!res.ok) {
      console.log("Failed to fetch live data:", res.status);
      return;
    }
    const json = await res.json();
    const nodesField = json.fields?.nodes?.arrayValue?.values || [];
    const targetId = "node-1781346418630"; // Node 10
    
    for (const nodeVal of nodesField) {
      const mapVal = nodeVal.mapValue?.fields || {};
      const id = mapVal.id?.stringValue || "";
      if (id === targetId) {
        const title = mapVal.title?.stringValue || "";
        console.log(`Title: "${title}"`);
        
        const content = mapVal.content?.mapValue?.fields || {};
        const customHtml = content.customHtml?.stringValue || "";
        
        // Strip style blocks first to focus on the markup tags
        const bodyHtml = customHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
        
        // Let's print out all unique tags with all their classes and attributes
        console.log("MARKUP TAGS ENCOUNTERED WITH SIZING CLUES:");
        const tagRegex = /<([a-z0-9-]+)([^>]*)>/gi;
        let match;
        while ((match = tagRegex.exec(bodyHtml)) !== null) {
          const tagName = match[1];
          const attrs = match[2];
          if (attrs.includes("class") || attrs.includes("style") || tagName === "table" || tagName === "iframe") {
            // Trim and format for clear review
            const cleanAttrs = attrs.replace(/\s+/g, " ").trim();
            if (cleanAttrs.length > 0) {
              console.log(`  <${tagName} ${cleanAttrs}>`);
            }
          }
        }
      }
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

parseStructure();
