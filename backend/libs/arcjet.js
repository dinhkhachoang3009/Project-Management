import arcjet, {
  detectBot,
  shield,
  tokenBucket,
  validateEmail,
} from "@arcjet/node";

const aj = arcjet({
  // Get your site key from https://app.arcjet.com and set it as an environment
  // variable rather than hard coding.
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"], // Track requests by IP
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
    validateEmail({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      // block disposable, invalid, and email addresses with no MX records
      deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
    tokenBucket({
      mode: "LIVE",
      refillRate: 5, // Refill 5 tokens per interval
      interval: 10, // Refill every 10 seconds
      capacity: 10, // Bucket capacity of 10 tokens
    }),
  ],
});

export default aj;
// // Example of using Arcjet as middleware in an Express app
// export const arcjetMiddleware = (req, res, next) => {
//   aj.run(req, res)
//     .then((result) => {
//       if (result.blocked) {
//         // Request was blocked by Arcjet
//         res.status(403).send("Forbidden");
//       } else {
//         // Request is allowed, but check if it's a spoofed bot
//         if (isSpoofedBot(result)) {
//           console.log("Spoofed bot detected:", result);
//           // Optionally block or take other action against spoofed bots
//           res.status(403).send("Forbidden");
//         } else {
//           // Proceed to the next middleware or route handler
//           next();
//         }
//       }
//     })
//     .catch((error) => {
//       console.error("Error running Arcjet:", error);
//       // In case of an error with Arcjet, you can choose to allow or block the request
//       res.status(500).send("Internal Server Error");
//     });
// };
