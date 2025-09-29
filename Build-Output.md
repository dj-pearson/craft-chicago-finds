2025-09-29T16:09:21.612475Z	Cloning repository...
2025-09-29T16:09:23.156182Z	From https://github.com/dj-pearson/craft-chicago-finds
2025-09-29T16:09:23.156639Z	 * branch            81a1e90d5eb7de85c2ecad3b94ba06031deace29 -> FETCH_HEAD
2025-09-29T16:09:23.156766Z	
2025-09-29T16:09:23.217002Z	HEAD is now at 81a1e90 Update project configuration: Rename project to "craft-chicago-finds", bump version to 1.0.0, and adjust package dependencies for compatibility. Streamline wrangler.toml for npm build command and remove outdated GitHub Actions workflow for deployment.
2025-09-29T16:09:23.217759Z	
2025-09-29T16:09:23.298171Z	
2025-09-29T16:09:23.298797Z	Using v2 root directory strategy
2025-09-29T16:09:23.322428Z	Success: Finished cloning repository files
2025-09-29T16:09:25.101892Z	Checking for configuration in a Wrangler configuration file (BETA)
2025-09-29T16:09:25.102571Z	
2025-09-29T16:09:25.104152Z	Found wrangler.toml file. Reading build configuration...
2025-09-29T16:09:26.218825Z	A wrangler.toml file was found but it does not appear to be valid. Did you mean to use wrangler.toml to configure Pages? If so, then make sure the file is valid and contains the `pages_build_output_dir` property. Skipping file and continuing.
2025-09-29T16:09:26.283625Z	Found a .tool-versions file in user-specified root directory. Installing dependencies.
2025-09-29T16:09:26.807441Z	bun 1.2.15 is already installed
2025-09-29T16:09:26.915879Z	dart-sass-embedded 1.62.1 is already installed
2025-09-29T16:09:27.020685Z	golang 1.24.3 is already installed
2025-09-29T16:09:27.133697Z	hugo extended_0.147.7 is already installed
2025-09-29T16:09:28.247684Z	Trying to update node-build... ok
2025-09-29T16:09:28.365832Z	To follow progress, use 'tail -f /tmp/node-build.20250929160928.741.log' or pass --verbose
2025-09-29T16:09:28.4609Z	Downloading node-v18.19.0-linux-x64.tar.gz...
2025-09-29T16:09:28.695557Z	-> https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.gz
2025-09-29T16:09:30.430618Z	
2025-09-29T16:09:30.430908Z	WARNING: node-v18.19.0-linux-x64 is in LTS Maintenance mode and nearing its end of life.
2025-09-29T16:09:30.431066Z	It only receives *critical* security updates, *critical* bug fixes and documentation updates.
2025-09-29T16:09:30.431177Z	
2025-09-29T16:09:30.431728Z	Installing node-v18.19.0-linux-x64...
2025-09-29T16:09:30.815574Z	Installed node-v18.19.0-linux-x64 to /opt/buildhome/.asdf/installs/nodejs/18.19.0
2025-09-29T16:09:30.815799Z	
2025-09-29T16:09:31.622781Z	python 3.13.3 is already installed
2025-09-29T16:09:31.654038Z	python 2.7.18 is already installed
2025-09-29T16:09:31.75673Z	ruby 3.4.4 is already installed
2025-09-29T16:09:31.771329Z	Detected the following tools from environment: nodejs@18.19.0, npm@10.9.2, bun@1.2.15
2025-09-29T16:09:31.771637Z	Installing nodejs 18.19.0
2025-09-29T16:09:31.834238Z	nodejs 18.19.0 is already installed
2025-09-29T16:09:32.155953Z	Installing project dependencies: bun install --frozen-lockfile
2025-09-29T16:09:32.366331Z	[0.05ms] ".env"
2025-09-29T16:09:32.367854Z	bun install v1.2.15 (df017990)
2025-09-29T16:09:32.371279Z	Resolving dependencies
2025-09-29T16:09:33.960489Z	Resolved, downloaded and extracted [570]
2025-09-29T16:09:33.962506Z	error: lockfile had changes, but lockfile is frozen
2025-09-29T16:09:33.962863Z	note: try re-running without --frozen-lockfile and commit the updated lockfile
2025-09-29T16:09:33.977738Z	Error: Exit with error code: 1
2025-09-29T16:09:33.977962Z	    at ChildProcess.<anonymous> (/snapshot/dist/run-build.js)
2025-09-29T16:09:33.978154Z	    at Object.onceWrapper (node:events:652:26)
2025-09-29T16:09:33.97827Z	    at ChildProcess.emit (node:events:537:28)
2025-09-29T16:09:33.978372Z	    at ChildProcess._handle.onexit (node:internal/child_process:291:12)
2025-09-29T16:09:33.987869Z	Failed: build command exited with code: 1
2025-09-29T16:09:35.372055Z	Failed: error occurred while running build command