2025-09-29T16:04:26.554734Z	Cloning repository...
2025-09-29T16:04:27.85163Z	From https://github.com/dj-pearson/craft-chicago-finds
2025-09-29T16:04:27.852373Z	 * branch            8e45302d0412e231cff8d7a900d3f41df6340f92 -> FETCH_HEAD
2025-09-29T16:04:27.852503Z	
2025-09-29T16:04:27.915366Z	HEAD is now at 8e45302 Update dependencies in package.json: Downgrade @radix-ui/react-avatar and @radix-ui/react-scroll-area versions for compatibility, and adjust postcss version for stability. Simplify Vite configuration by removing unused lovable-tagger plugin.
2025-09-29T16:04:27.915885Z	
2025-09-29T16:04:27.996202Z	
2025-09-29T16:04:27.996744Z	Using v2 root directory strategy
2025-09-29T16:04:28.018341Z	Success: Finished cloning repository files
2025-09-29T16:04:30.139333Z	Checking for configuration in a Wrangler configuration file (BETA)
2025-09-29T16:04:30.139959Z	
2025-09-29T16:04:30.141431Z	Found wrangler.toml file. Reading build configuration...
2025-09-29T16:04:31.246192Z	A wrangler.toml file was found but it does not appear to be valid. Did you mean to use wrangler.toml to configure Pages? If so, then make sure the file is valid and contains the `pages_build_output_dir` property. Skipping file and continuing.
2025-09-29T16:04:31.323109Z	Detected the following tools from environment: nodejs@18.19.0, npm@10.9.2, bun@1.2.15
2025-09-29T16:04:31.323982Z	Installing nodejs 18.19.0
2025-09-29T16:04:32.380271Z	Trying to update node-build... ok
2025-09-29T16:04:32.476986Z	To follow progress, use 'tail -f /tmp/node-build.20250929160432.494.log' or pass --verbose
2025-09-29T16:04:32.574195Z	Downloading node-v18.19.0-linux-x64.tar.gz...
2025-09-29T16:04:32.794899Z	-> https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.gz
2025-09-29T16:04:34.4452Z	
2025-09-29T16:04:34.445467Z	WARNING: node-v18.19.0-linux-x64 is in LTS Maintenance mode and nearing its end of life.
2025-09-29T16:04:34.445618Z	It only receives *critical* security updates, *critical* bug fixes and documentation updates.
2025-09-29T16:04:34.445741Z	
2025-09-29T16:04:34.445872Z	Installing node-v18.19.0-linux-x64...
2025-09-29T16:04:34.853749Z	Installed node-v18.19.0-linux-x64 to /opt/buildhome/.asdf/installs/nodejs/18.19.0
2025-09-29T16:04:34.854026Z	
2025-09-29T16:04:35.878069Z	Installing project dependencies: bun install --frozen-lockfile
2025-09-29T16:04:36.081069Z	[0.06ms] ".env"
2025-09-29T16:04:36.082252Z	bun install v1.2.15 (df017990)
2025-09-29T16:04:36.087339Z	Resolving dependencies
2025-09-29T16:04:37.807379Z	Resolved, downloaded and extracted [570]
2025-09-29T16:04:37.809527Z	error: lockfile had changes, but lockfile is frozen
2025-09-29T16:04:37.809673Z	note: try re-running without --frozen-lockfile and commit the updated lockfile
2025-09-29T16:04:37.823095Z	Error: Exit with error code: 1
2025-09-29T16:04:37.823602Z	    at ChildProcess.<anonymous> (/snapshot/dist/run-build.js)
2025-09-29T16:04:37.823722Z	    at Object.onceWrapper (node:events:652:26)
2025-09-29T16:04:37.823985Z	    at ChildProcess.emit (node:events:537:28)
2025-09-29T16:04:37.824131Z	    at ChildProcess._handle.onexit (node:internal/child_process:291:12)
2025-09-29T16:04:37.835347Z	Failed: build command exited with code: 1
2025-09-29T16:04:39.020455Z	Failed: error occurred while running build command