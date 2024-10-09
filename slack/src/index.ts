// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from "@netlify/sdk";

const extension = new NetlifyExtension();

extension.addFunctions("./src/functions", {
  prefix: "my_unique_prefix",
  shouldInjectFunction: () => {
    // If the function is not enabled, return early
    if (!process.env["SLACK_ENABLED"]) {
      return;
    }
    return true;
  },
});

export { extension };

