2025-09-29T16:12:24.284345Z	Cloning repository...
2025-09-29T16:12:25.805035Z	From https://github.com/dj-pearson/craft-chicago-finds
2025-09-29T16:12:25.805718Z	 * branch            c0dd0f8bfc1da3677bf18c7c8a316f3fff6b101d -> FETCH_HEAD
2025-09-29T16:12:25.805943Z	
2025-09-29T16:12:25.866924Z	HEAD is now at c0dd0f8 Remove outdated configuration files and scripts: Delete .tool-versions, build.sh, and package-manager.json. Simplify .npmrc and update wrangler.toml for production environment settings, enhancing project clarity and maintainability.
2025-09-29T16:12:25.867357Z	
2025-09-29T16:12:25.953922Z	
2025-09-29T16:12:25.954429Z	Using v2 root directory strategy
2025-09-29T16:12:25.980569Z	Success: Finished cloning repository files
2025-09-29T16:12:28.003259Z	Checking for configuration in a Wrangler configuration file (BETA)
2025-09-29T16:12:28.003955Z	
2025-09-29T16:12:28.00566Z	Found wrangler.toml file. Reading build configuration...
2025-09-29T16:12:28.012273Z	pages_build_output_dir: dist
2025-09-29T16:12:28.012422Z	Build environment variables: (none found)
2025-09-29T16:12:29.124061Z	Successfully read wrangler.toml file.
2025-09-29T16:12:29.20621Z	Detected the following tools from environment: nodejs@18.19.0, npm@10.9.2, bun@1.2.15
2025-09-29T16:12:29.206724Z	Installing nodejs 18.19.0
2025-09-29T16:12:30.353023Z	Trying to update node-build... ok
2025-09-29T16:12:30.459206Z	To follow progress, use 'tail -f /tmp/node-build.20250929161230.494.log' or pass --verbose
2025-09-29T16:12:30.561005Z	Downloading node-v18.19.0-linux-x64.tar.gz...
2025-09-29T16:12:30.81358Z	-> https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.gz
2025-09-29T16:12:32.629282Z	
2025-09-29T16:12:32.629571Z	WARNING: node-v18.19.0-linux-x64 is in LTS Maintenance mode and nearing its end of life.
2025-09-29T16:12:32.629737Z	It only receives *critical* security updates, *critical* bug fixes and documentation updates.
2025-09-29T16:12:32.629966Z	
2025-09-29T16:12:32.630118Z	Installing node-v18.19.0-linux-x64...
2025-09-29T16:12:33.028767Z	Installed node-v18.19.0-linux-x64 to /opt/buildhome/.asdf/installs/nodejs/18.19.0
2025-09-29T16:12:33.029127Z	
2025-09-29T16:12:34.126097Z	Installing project dependencies: bun install --frozen-lockfile
2025-09-29T16:12:34.362497Z	[0.06ms] ".env"
2025-09-29T16:12:34.364196Z	bun install v1.2.15 (df017990)
2025-09-29T16:12:34.367761Z	Resolving dependencies
2025-09-29T16:12:36.030899Z	Resolved, downloaded and extracted [570]
2025-09-29T16:12:36.032887Z	error: lockfile had changes, but lockfile is frozen
2025-09-29T16:12:36.033176Z	note: try re-running without --frozen-lockfile and commit the updated lockfile
2025-09-29T16:12:36.047364Z	Error: Exit with error code: 1
2025-09-29T16:12:36.047838Z	    at ChildProcess.<anonymous> (/snapshot/dist/run-build.js)
2025-09-29T16:12:36.048012Z	    at Object.onceWrapper (node:events:652:26)
2025-09-29T16:12:36.048162Z	    at ChildProcess.emit (node:events:537:28)
2025-09-29T16:12:36.048296Z	    at ChildProcess._handle.onexit (node:internal/child_process:291:12)
2025-09-29T16:12:36.058758Z	Failed: build command exited with code: 1
2025-09-29T16:12:37.326852Z	Failed: error occurred while running build command