# STRVCT
direct manipulation of structured content


##Getting started

Build system is currently setup for VSCode. To open the project, open this root source folder in VSCode.

First, you'll need to start the local HTTPS web server by running:

		node local-web-server/main.js
 	 
 in the root source folder. VSCode should have a "launch local HTTPS" run option you can now use to launch the app. It will launch Chrome, and the first time you'll need to select a button to tell it to ignore the lack of a proper SSL setup (as we are using a local server).
 
 To work on debugging or writting code, you'll want to install the following VCCode extensions:
 
 - ESLint (from Microsoft), 
 - JavaScript Debugger nightly (from Microsoft)
 - json (by ZainChen)
 
 ### getting ESLint working
 
 You may need to install eslint if you don't already have it.
 
 		npm init @eslint/config -g
 		
 The above line installs it gloablly. For more info, see: https://eslint.org/docs/latest/user-guide/getting-started
 
 To get Eslint to work with Ecmascript6 (which this project uses), you may need to add a .eslintrc configuration file to your home directory. Here's mine:
 
 		{
		    "env": {
 		       "es6": true
		    }
		}

If this doesn't work, you may need to check your VSCode settings, like verifying this setting:

		eslint.enable: true
		
And you may need to run:
		
		eslint init
		
Sorry I don't have better eslint instructions. I got it working but may have forgotten how.

	
 
 


