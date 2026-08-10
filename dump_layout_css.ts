import fs from 'fs';

async function dumpLayoutCss() {
  try {
    const url = "https://firestore.googleapis.com/v1/projects/gen-lang-client-0568439716/databases/ai-studio-15655e8c-18ff-4359-b057-60febe5dddfc/documents/portfolio/main";
    const res = await fetch(url);
    if (!res.ok) {
      console.log("Failed to fetch live data:", res.status);
      return;
    }
    const json = await res.json();
    const nodesField = json.fields?.nodes?.arrayValue?.values || [];
    const targetIds = ["node-1781346418630", "node-1781333505478", "node-1781332482856"];
    
    for (const nodeVal of nodesField) {
      const mapVal = nodeVal.mapValue?.fields || {};
      const id = mapVal.id?.stringValue || "";
      if (targetIds.includes(id)) {
        console.log(`\n=================== NODE ID: ${id} ===================`);
        const title = mapVal.title?.stringValue || "";
        console.log(`Title: "${title}"`);
        
        const content = mapVal.content?.mapValue?.fields || {};
        const customHtml = content.customHtml?.stringValue || "";
        
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let match;
        while ((match = styleRegex.exec(customHtml)) !== null) {
          const css = match[1];
          const lines = css.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(".two-up") || line.includes(".flow") || line.includes(".pipe") || line.includes(".step") || line.includes(".aud-grid") || line.includes(".hero")) {
              console.log(`  Line ${i+1}: ${line.trim()}`);
              // print adjacent lines
              for (let j = 1; j <= 4; j++) {
                if (lines[i+j]) console.log(`    +${j}: ${lines[i+j].trim()}`);
              }
            }
          }
        }
      }
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

dumpLayoutCss();
