2025-09-29T16:14:14.695307Z	Cloning repository...
2025-09-29T16:14:15.974339Z	From https://github.com/dj-pearson/craft-chicago-finds
2025-09-29T16:14:15.974883Z	 * branch            42364368f0f0a95e58c8372cd61c240897ca2e18 -> FETCH_HEAD
2025-09-29T16:14:15.974984Z	
2025-09-29T16:14:16.033489Z	HEAD is now at 4236436 Remove bun.lockb file: Delete outdated lock file to streamline project dependencies and improve maintainability.
2025-09-29T16:14:16.03409Z	
2025-09-29T16:14:16.11139Z	
2025-09-29T16:14:16.111946Z	Using v2 root directory strategy
2025-09-29T16:14:16.133195Z	Success: Finished cloning repository files
2025-09-29T16:14:17.974569Z	Checking for configuration in a Wrangler configuration file (BETA)
2025-09-29T16:14:17.975136Z	
2025-09-29T16:14:17.976963Z	Found wrangler.toml file. Reading build configuration...
2025-09-29T16:14:17.983596Z	pages_build_output_dir: dist
2025-09-29T16:14:17.983766Z	Build environment variables: (none found)
2025-09-29T16:14:19.087899Z	Successfully read wrangler.toml file.
2025-09-29T16:14:19.163277Z	Detected the following tools from environment: nodejs@18.19.0, npm@10.9.2
2025-09-29T16:14:19.163907Z	Installing nodejs 18.19.0
2025-09-29T16:14:20.418492Z	Trying to update node-build... ok
2025-09-29T16:14:20.515876Z	To follow progress, use 'tail -f /tmp/node-build.20250929161420.494.log' or pass --verbose
2025-09-29T16:14:20.614091Z	Downloading node-v18.19.0-linux-x64.tar.gz...
2025-09-29T16:14:20.837209Z	-> https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.gz
2025-09-29T16:14:22.578744Z	
2025-09-29T16:14:22.578986Z	WARNING: node-v18.19.0-linux-x64 is in LTS Maintenance mode and nearing its end of life.
2025-09-29T16:14:22.579332Z	It only receives *critical* security updates, *critical* bug fixes and documentation updates.
2025-09-29T16:14:22.579467Z	
2025-09-29T16:14:22.579574Z	Installing node-v18.19.0-linux-x64...
2025-09-29T16:14:22.973228Z	Installed node-v18.19.0-linux-x64 to /opt/buildhome/.asdf/installs/nodejs/18.19.0
2025-09-29T16:14:22.973659Z	
2025-09-29T16:14:23.992005Z	Installing project dependencies: npm clean-install --progress=false
2025-09-29T16:14:25.135886Z	npm ERR! code ERESOLVE
2025-09-29T16:14:25.138049Z	npm ERR! ERESOLVE could not resolve
2025-09-29T16:14:25.138518Z	npm ERR! 
2025-09-29T16:14:25.138688Z	npm ERR! While resolving: react-day-picker@8.10.1
2025-09-29T16:14:25.139096Z	npm ERR! Found: date-fns@4.1.0
2025-09-29T16:14:25.139346Z	npm ERR! node_modules/date-fns
2025-09-29T16:14:25.139454Z	npm ERR!   date-fns@"^4.1.0" from the root project
2025-09-29T16:14:25.13966Z	npm ERR! 
2025-09-29T16:14:25.139797Z	npm ERR! Could not resolve dependency:
2025-09-29T16:14:25.139924Z	npm ERR! peer date-fns@"^2.28.0 || ^3.0.0" from react-day-picker@8.10.1
2025-09-29T16:14:25.140056Z	npm ERR! node_modules/react-day-picker
2025-09-29T16:14:25.140211Z	npm ERR!   react-day-picker@"8.10.1" from the root project
2025-09-29T16:14:25.140349Z	npm ERR! 
2025-09-29T16:14:25.140491Z	npm ERR! Conflicting peer dependency: date-fns@3.6.0
2025-09-29T16:14:25.140626Z	npm ERR! node_modules/date-fns
2025-09-29T16:14:25.140737Z	npm ERR!   peer date-fns@"^2.28.0 || ^3.0.0" from react-day-picker@8.10.1
2025-09-29T16:14:25.140868Z	npm ERR!   node_modules/react-day-picker
2025-09-29T16:14:25.140953Z	npm ERR!     react-day-picker@"8.10.1" from the root project
2025-09-29T16:14:25.141039Z	npm ERR! 
2025-09-29T16:14:25.141157Z	npm ERR! Fix the upstream dependency conflict, or retry
2025-09-29T16:14:25.14128Z	npm ERR! this command with --force or --legacy-peer-deps
2025-09-29T16:14:25.141964Z	npm ERR! to accept an incorrect (and potentially broken) dependency resolution.
2025-09-29T16:14:25.142278Z	npm ERR! 
2025-09-29T16:14:25.142467Z	npm ERR! 
2025-09-29T16:14:25.142741Z	npm ERR! For a full report see:
2025-09-29T16:14:25.142872Z	npm ERR! /opt/buildhome/.npm/_logs/2025-09-29T16_14_24_493Z-eresolve-report.txt
2025-09-29T16:14:25.142947Z	
2025-09-29T16:14:25.143016Z	npm ERR! A complete log of this run can be found in: /opt/buildhome/.npm/_logs/2025-09-29T16_14_24_493Z-debug-0.log
2025-09-29T16:14:25.152201Z	Error: Exit with error code: 1
2025-09-29T16:14:25.152451Z	    at ChildProcess.<anonymous> (/snapshot/dist/run-build.js)
2025-09-29T16:14:25.152633Z	    at Object.onceWrapper (node:events:652:26)
2025-09-29T16:14:25.152752Z	    at ChildProcess.emit (node:events:537:28)
2025-09-29T16:14:25.152844Z	    at ChildProcess._handle.onexit (node:internal/child_process:291:12)
2025-09-29T16:14:25.160515Z	Failed: build command exited with code: 1
2025-09-29T16:14:26.702705Z	Failed: error occurred while running build command