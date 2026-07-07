import { writeAppDocumentationToDisk } from "../src/lib/admin/generate-app-documentation";

writeAppDocumentationToDisk()
  .then((meta) => {
    console.log("App guide regenerated:", JSON.stringify(meta));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
