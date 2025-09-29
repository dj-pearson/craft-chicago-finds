2025-09-29T15:53:28.197186Z	Cloning repository...
2025-09-29T15:53:31.369749Z	From https://github.com/dj-pearson/craft-chicago-finds
2025-09-29T15:53:31.370242Z	 * branch            218988a1bbf15efb36130d5ea15ceca68a01dcf7 -> FETCH_HEAD
2025-09-29T15:53:31.370359Z	
2025-09-29T15:53:31.430966Z	HEAD is now at 218988a Refactor package.json and wrangler.toml: Remove production build scripts and streamline Cloudflare Pages configuration for local development, enhancing clarity and maintainability.
2025-09-29T15:53:31.431381Z	
2025-09-29T15:53:31.506624Z	
2025-09-29T15:53:31.507415Z	Using v2 root directory strategy
2025-09-29T15:53:31.529723Z	Success: Finished cloning repository files
2025-09-29T15:53:33.836945Z	Checking for configuration in a Wrangler configuration file (BETA)
2025-09-29T15:53:33.837803Z	
2025-09-29T15:53:33.839399Z	Found wrangler.toml file. Reading build configuration...
2025-09-29T15:53:34.950352Z	A wrangler.toml file was found but it does not appear to be valid. Did you mean to use wrangler.toml to configure Pages? If so, then make sure the file is valid and contains the `pages_build_output_dir` property. Skipping file and continuing.
2025-09-29T15:53:35.017923Z	Detected the following tools from environment: npm@10.9.2, bun@1.2.15, nodejs@22.16.0
2025-09-29T15:53:35.018478Z	Installing project dependencies: bun install --frozen-lockfile
2025-09-29T15:53:35.396801Z	[2.56ms] ".env"
2025-09-29T15:53:35.42056Z	bun install v1.2.15 (df017990)
2025-09-29T15:53:35.508349Z	Resolving dependencies
2025-09-29T15:53:35.937035Z	Resolved, downloaded and extracted [194]
2025-09-29T15:53:35.94027Z	error: lockfile had changes, but lockfile is frozen
2025-09-29T15:53:35.940442Z	note: try re-running without --frozen-lockfile and commit the updated lockfile
2025-09-29T15:53:35.951163Z	Error: Exit with error code: 1
2025-09-29T15:53:35.951363Z	    at ChildProcess.<anonymous> (/snapshot/dist/run-build.js)
2025-09-29T15:53:35.95173Z	    at Object.onceWrapper (node:events:652:26)
2025-09-29T15:53:35.951908Z	    at ChildProcess.emit (node:events:537:28)
2025-09-29T15:53:35.952072Z	    at ChildProcess._handle.onexit (node:internal/child_process:291:12)
2025-09-29T15:53:35.959189Z	Failed: build command exited with code: 1
2025-09-29T15:53:37.399336Z	Failed: error occurred while running build command