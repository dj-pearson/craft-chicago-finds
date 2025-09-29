2025-09-29T15:56:47.140176Z	Cloning repository...
2025-09-29T15:56:48.365721Z	From https://github.com/dj-pearson/craft-chicago-finds
2025-09-29T15:56:48.36623Z	 * branch            9a150e558aa64b2265585ca154eea676fd987fd1 -> FETCH_HEAD
2025-09-29T15:56:48.366353Z	
2025-09-29T15:56:48.428428Z	HEAD is now at 9a150e5 Update package.json: Rename project, bump version to 1.0.0, and specify Node and npm engine requirements. Adjust dependencies and devDependencies for compatibility and performance improvements.
2025-09-29T15:56:48.428862Z	
2025-09-29T15:56:48.509746Z	
2025-09-29T15:56:48.510287Z	Using v2 root directory strategy
2025-09-29T15:56:48.534369Z	Success: Finished cloning repository files
2025-09-29T15:56:50.342189Z	Checking for configuration in a Wrangler configuration file (BETA)
2025-09-29T15:56:50.343365Z	
2025-09-29T15:56:50.344482Z	Found wrangler.toml file. Reading build configuration...
2025-09-29T15:56:51.459339Z	A wrangler.toml file was found but it does not appear to be valid. Did you mean to use wrangler.toml to configure Pages? If so, then make sure the file is valid and contains the `pages_build_output_dir` property. Skipping file and continuing.
2025-09-29T15:56:51.537271Z	Detected the following tools from environment: nodejs@18.19.0, npm@10.9.2, bun@1.2.15
2025-09-29T15:56:51.537865Z	Installing nodejs 18.19.0
2025-09-29T15:56:52.636702Z	Trying to update node-build... ok
2025-09-29T15:56:52.734514Z	To follow progress, use 'tail -f /tmp/node-build.20250929155652.494.log' or pass --verbose
2025-09-29T15:56:52.83223Z	Downloading node-v18.19.0-linux-x64.tar.gz...
2025-09-29T15:56:53.081473Z	-> https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.gz
2025-09-29T15:56:54.774254Z	
2025-09-29T15:56:54.774485Z	WARNING: node-v18.19.0-linux-x64 is in LTS Maintenance mode and nearing its end of life.
2025-09-29T15:56:54.774831Z	It only receives *critical* security updates, *critical* bug fixes and documentation updates.
2025-09-29T15:56:54.774909Z	
2025-09-29T15:56:54.775237Z	Installing node-v18.19.0-linux-x64...
2025-09-29T15:56:55.172747Z	Installed node-v18.19.0-linux-x64 to /opt/buildhome/.asdf/installs/nodejs/18.19.0
2025-09-29T15:56:55.172948Z	
2025-09-29T15:56:56.219228Z	Installing project dependencies: bun install --frozen-lockfile
2025-09-29T15:56:56.453879Z	[0.05ms] ".env"
2025-09-29T15:56:56.455485Z	bun install v1.2.15 (df017990)
2025-09-29T15:56:56.459276Z	Resolving dependencies
2025-09-29T15:56:58.116324Z	Resolved, downloaded and extracted [572]
2025-09-29T15:56:58.116589Z	error: No version matching "^8.5.11" found for specifier "postcss" (but package exists)
2025-09-29T15:56:58.117079Z	
2025-09-29T15:56:58.117195Z	error: No version matching "^1.1.11" found for specifier "@radix-ui/react-avatar" (but package exists)
2025-09-29T15:56:58.117713Z	
2025-09-29T15:56:58.117807Z	error: No version matching "^1.2.11" found for specifier "@radix-ui/react-scroll-area" (but package exists)
2025-09-29T15:56:58.118332Z	
2025-09-29T15:56:58.118415Z	error: No version matching "^0.0.1" found for specifier "lovable-tagger" (but package exists)
2025-09-29T15:56:58.119003Z	error: lovable-tagger@^0.0.1 failed to resolve
2025-09-29T15:56:58.119167Z	error: postcss@^8.5.11 failed to resolve
2025-09-29T15:56:58.119513Z	error: @radix-ui/react-avatar@^1.1.11 failed to resolve
2025-09-29T15:56:58.119611Z	error: @radix-ui/react-scroll-area@^1.2.11 failed to resolve
2025-09-29T15:56:58.134909Z	Error: Exit with error code: 1
2025-09-29T15:56:58.13525Z	    at ChildProcess.<anonymous> (/snapshot/dist/run-build.js)
2025-09-29T15:56:58.135425Z	    at Object.onceWrapper (node:events:652:26)
2025-09-29T15:56:58.135537Z	    at ChildProcess.emit (node:events:537:28)
2025-09-29T15:56:58.135683Z	    at ChildProcess._handle.onexit (node:internal/child_process:291:12)
2025-09-29T15:56:58.146555Z	Failed: build command exited with code: 1
2025-09-29T15:56:59.377847Z	Failed: error occurred while running build command