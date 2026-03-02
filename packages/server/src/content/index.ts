// Content registry — side-effect imports that register all content modules.
// Import this file once to populate the registry used by getContentForPlayer().

// Tutorial (gamestate items)
import "./tutorial.js";

// OpenBrain
import "./openbrain/slack.js";
import "./openbrain/wandb.js";
import "./openbrain/email.js";
import "./openbrain/news.js";
import "./openbrain/memo.js";
import "./openbrain/security.js";
import "./openbrain/signal.js";
import "./openbrain/flavor.js";
// Prometheus
import "./prometheus/slack.js";
import "./prometheus/wandb.js";
import "./prometheus/email.js";
import "./prometheus/news.js";
import "./prometheus/arxiv.js";
import "./prometheus/signal.js";
import "./prometheus/memo.js";
import "./prometheus/flavor.js";

// China
import "./china/signal.js";
import "./china/compute.js";
import "./china/intel.js";
import "./china/military.js";
import "./china/wandb.js";
import "./china/news.js";
import "./china/slack.js";
import "./china/memo.js";
import "./china/flavor.js";

// External
import "./external/news.js";
import "./external/email.js";
import "./external/bloomberg.js";
import "./external/briefing.js";
import "./external/signal.js";
import "./external/memo.js";
import "./external/flavor.js";
// Shared (cross-faction)
import "./shared/twitter.js";
import "./shared/arxiv.js";
