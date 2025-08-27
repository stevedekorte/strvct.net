"use strict";

let blessed;
try {
  blessed = require('blessed');
} catch (e) {
  throw new Error('SvCliBrowser requires the blessed module to be installed: ' + e.message);
}

/**
 * Simplified CLI Browser for debugging
 */
class SvCliBrowser {
  constructor (rootNode /*, options = {}*/) {
    if (!rootNode) {
      throw new Error('SvCliBrowser requires a root node');
    }
    
    this._rootNode = rootNode;
    
    // Create screen
    this._screen = blessed.screen({
      smartCSR: true,
      title: 'Simple Browser'
    });
    
    // Create a simple box
    this._box = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      content: 'SvCliBrowser Started\n\nPress q to quit',
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'black'
      }
    });
    
    this._screen.append(this._box);
    
    // Basic key handler
    this._screen.key(['q', 'C-c'], () => {
      process.exit(0);
    });
    
    // Test getting subnodes
    let content = 'SvCliBrowser Started\n\n';
    content += 'Root node type: ' + (rootNode.type ? rootNode.type() : 'unknown') + '\n';
    
    if (rootNode.subnodes && typeof rootNode.subnodes === 'function') {
      try {
        const subnodes = rootNode.subnodes();
        content += 'Subnodes count: ' + subnodes.length + '\n\n';
        
        subnodes.slice(0, 5).forEach((node, i) => {
          const title = node.title ? node.title() : node.type();
          content += `${i + 1}. ${title}\n`;
        });
      } catch (e) {
        content += 'Error getting subnodes: ' + e.message + '\n';
      }
    } else {
      content += 'No subnodes method found\n';
    }
    
    content += '\nPress q to quit';
    this._box.setContent(content);
    
    this._screen.render();
  }
  
  setRootNode (/*node*/) {
    // Do nothing for now
    return this;
  }
}

SvGlobals.set("SvCliBrowser", SvCliBrowser);