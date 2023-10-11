# STRVCT

direct manipulation of structured content

##Getting started

---

FOR NEW REPOS:

To set up strvct submodule, from within project folder run:

    git submodule add https://github.com/stevedekorte/strvct.net.git strvct

If you want to deploy your app on Github Pages, you'll need to add a .nojekyll file to your root folder.

---

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

// ----------------------------------

Some frameworks which had to be written to build this:

- meta object framework (slots)
- extensive OO extensions to common classes
- desktop like web OO UI framework
- architecture and protocol for model-to-view naked object UI, standard field components
- miller column insired stacking UI framework
- notifications system
- auto syncing system/protocol between model and views
- integrated theming system
- client side object persistence / object pool framework
- gesture recognition framework
- package builder & boot and client side caching system
- auto resource management, loading, and caching system
- common protocol for resources such as fonts, sounds, images, icons, json data files
- transparent mutation observers for common classes
