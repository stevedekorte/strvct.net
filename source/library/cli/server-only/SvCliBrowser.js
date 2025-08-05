"use strict";

const blessed = require('blessed');

/**
 * @class SvCliBrowser
 * @extends Object
 * @classdesc A terminal-based Miller columns browser for navigating hierarchical node structures.
 * Provides keyboard navigation, item selection, editing capabilities, and clipboard operations.
 * Arrow keys navigate, Enter/Return selects, and Ctrl+C exits.
 */

class SvCliBrowser extends Object {
  constructor (rootNode, options = {}) {
    super();

    if (!rootNode) {
      throw new Error('SvCliBrowser requires a root node');
    }
    
    this._rootNode = rootNode;
    this._options = options;
    
    // State management
    this._columns = [];
    this._currentPath = [];
    this._currentNode = rootNode;
    this._focusedColumnIndex = 0;
    
    // UI configuration
    this._defaultColumnWidth = options.columnWidth || 45;
    this._columnWidth = this._defaultColumnWidth;
    
    // UI components
    this._screen = null;
    this._background = null;
    this._breadcrumb = null;
    this._messageBox = null;
    this._logFilePath = null;
    
    // Console references for logging
    this._originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    
    // Prevent process from exiting
    process.stdin.resume();
    
    // Don't catch errors - let them bubble up
    this._initialize();
  }
  
  // ============================================================================
  // Public Methods
  // ============================================================================
  
  setRootNode (node) {
    if (!node) {
      throw new Error('Root node cannot be null');
    }
    
    this._rootNode = node;
    this._currentNode = node;
    this._currentPath = [];
    
    // Reset the UI to reflect the new root
    if (this._screen) {
      this._updateColumns(0);
      this._updateBreadcrumb();
      this.render();
    }
    
    return this;
  }
  
  // ============================================================================
  // Initialization
  // ============================================================================
  
  _initialize () {
    // Write to console before screen takes over
    console.log("SvCliBrowser: Starting initialization...");
    
    try {
      // Initialize logging first so we can log to file
      console.log("SvCliBrowser: About to initialize logging...");
      this._initializeLogging();
      console.log("SvCliBrowser: Logging initialized");
      
      // Now initialize screen (this takes over the terminal)
      console.log("SvCliBrowser: About to initialize screen...");
      this._initializeScreen();
      console.log("SvCliBrowser: Screen initialized");
      
      // After screen is initialized, all logging goes to file
      this._writeToLog("Screen initialized");
      
      // Add a keep-alive interval
      setInterval(() => {
        // Keep the process alive
      }, 1000);
      
      console.log("SvCliBrowser: About to initialize UI components...");
      this._initializeUIComponents();
      this._writeToLog("UI components initialized");
      
      console.log("SvCliBrowser: About to initialize key handlers...");
      this._initializeKeyHandlers();
      this._writeToLog("Key handlers initialized");
      
      console.log("SvCliBrowser: About to render...");
      this.render();
      this._writeToLog("Initial render complete");
      console.log("SvCliBrowser: Initialization complete!");
    } catch (error) {
      console.error("SvCliBrowser initialization error:", error);
      console.error("Stack:", error.stack);
      throw error;
    }
  }
  
  _initializeScreen () {
    this._screen = blessed.screen({
      smartCSR: true,
      title: 'Miller Columns Browser',
      border: false,
      style: {
        bg: '#222',
        border: false
      },
      fullUnicode: true,
      dockBorders: true,
      ignoreDockContrast: true,
      terminal: process.env.TERM || 'xterm-256color'
    });
    
    // Prevent automatic exit
    this._screen.key(['C-c'], () => {
      return process.exit(0);
    });
    
    // Catch any screen errors
    this._screen.on('error', (err) => {
      console.error('Blessed screen error:', err);
      this._writeToLog('Screen error: ' + err.message);
    });
    
    this._setupTerminalBackground();
    this._createBackgroundElement();
    this._registerExitHandler();
  }
  
  _setupTerminalBackground () {
    // Don't clear screen initially so we can see any errors
    // process.stdout.write('\x1b[48;2;34;34;34m'); // RGB 34,34,34 = #222
    // process.stdout.write('\x1b[2J'); // Clear screen
    // process.stdout.write('\x1b[H'); // Move cursor to home
    // process.stdout.write('\x1b[?25l'); // Hide cursor to prevent artifacts
  }
  
  _createBackgroundElement () {
    // Create a full-screen background element
    this._background = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      border: false,
      style: {
        bg: '#222'
      }
    });
    this._screen.append(this._background);
  }
  
  _registerExitHandler () {
    process.on('exit', () => {
      // Don't clear the screen on exit so we can see errors
      // process.stdout.write('\x1b[49m'); // Reset background color
      // process.stdout.write('\x1b[?25h'); // Show cursor
    });
  }
  
  _initializeLogging () {
    try {
      const fs = require('fs');
      const path = require('path');
      
      console.log("Logging: Getting current directory...");
      const cwd = process.cwd();
      console.log("Logging: CWD is", cwd);
      
      // Create logs directory if it doesn't exist
      const logsDir = path.join(cwd, 'logs');
      console.log("Logging: Logs directory will be", logsDir);
      
      if (!fs.existsSync(logsDir)) {
        console.log("Logging: Creating logs directory...");
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Create a log file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this._logFilePath = path.join(logsDir, `cli-browser-${timestamp}.log`);
      console.log("Logging: Log file path:", this._logFilePath);
      
      // Initialize log file
      console.log("Logging: Writing initial log entry...");
      this._writeToLog('CliBrowser session started');
      
      // Override console methods to write to file instead of screen
      console.log("Logging: Overriding console methods...");
      this._overrideConsoleMethods();
      console.log("Logging: Console methods overridden");
    } catch (error) {
      console.error("ERROR in _initializeLogging:", error);
      console.error("Stack:", error.stack);
      throw error;
    }
  }
  
  _overrideConsoleMethods () {
    try {
      const logToFile = (prefix, args) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        this._writeToLog(`[${prefix}] ${message}`);
      };
      
      console.log = (...args) => logToFile('LOG', args);
      console.error = (...args) => logToFile('ERROR', args);
      console.warn = (...args) => logToFile('WARN', args);
      console.info = (...args) => logToFile('INFO', args);
    } catch (error) {
      // Use original console if available
      if (this._originalConsole && this._originalConsole.error) {
        this._originalConsole.error("ERROR in _overrideConsoleMethods:", error);
      }
      throw error;
    }
  }
  
  _writeToLog (message) {
    if (!this._logFilePath) {
      // Can't log yet
      return;
    }
    
    const fs = require('fs');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    try {
      fs.appendFileSync(this._logFilePath, logMessage);
    } catch (err) {
      // Fallback to original console.error if logging fails
      if (this._originalConsole && this._originalConsole.error) {
        this._originalConsole.error('Failed to write to log:', err);
      }
    }
  }
  
  _initializeUIComponents () {
    this._createBreadcrumb();
    this._calculateColumnDimensions();
    this._createColumns();
    this._updateBreadcrumb();
    
    // Focus the first column immediately
    if (this._columns.length > 0) {
      this._columns[0].focus();
    }
  }
  
  _createBreadcrumb () {
    this._breadcrumb = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: 1,
      content: '',
      style: {
        fg: 'white',
        bg: '#333'
      },
      tags: true
    });
    this._screen.append(this._breadcrumb);
  }
  
  _calculateColumnDimensions () {
    const availableWidth = this._screen.width;
    const maxColumns = Math.floor(availableWidth / (this._defaultColumnWidth * this._screen.width / 100));
    const columnsNeeded = this._currentPath.length + 2; // current + 1 more
    
    if (columnsNeeded > maxColumns) {
      // Adjust column width to fit all needed columns
      this._columnWidth = Math.floor(90 / columnsNeeded);
    } else {
      this._columnWidth = this._defaultColumnWidth;
    }
  }
  
  _createColumns () {
    this._removeExistingColumns();
    
    const columnCount = Math.floor(100 / this._columnWidth);
    const columnHeight = this._screen.height - 2; // Account for breadcrumb
    
    for (let i = 0; i < columnCount; i++) {
      const column = this._createColumn(i, columnHeight);
      this._columns.push(column);
      this._screen.append(column);
    }
    
    this._updateColumns(0);
  }
  
  _removeExistingColumns () {
    this._columns.forEach(column => {
      this._screen.remove(column);
    });
    this._columns = [];
  }
  
  _createColumn (index, height) {
    const column = blessed.box({
      top: 1, // Below breadcrumb
      left: `${index * this._columnWidth}%`,
      width: `${this._columnWidth}%`,
      height: height,
      label: ' ',  // Initial empty label
      border: {
        type: 'line',
        fg: '#444'
      },
      style: {
        fg: 'white',
        bg: '#222',
        border: {
          fg: '#444'
        },
        focus: {
          border: {
            fg: 'cyan'
          }
        }
      },
      scrollable: false,  // Disable scrolling - we'll handle navigation manually
      mouse: true,
      keys: true,        // Enable keyboard input
      vi: false,         // Disable vi keys to avoid conflicts
      focusable: true,   // Make it focusable
      alwaysScroll: false,
      scrollbar: {
        style: {
          bg: 'yellow'
        }
      },
      tags: true  // Enable blessed tag parsing
    });
    
    // Initialize column state
    column.selected = 0;
    column.items = [];
    column.setItems = (items) => {
      column.items = items;
      if (column.selected >= items.length) {
        column.selected = 0;
      }
      this._renderColumnItems(column);
    };
    
    // Add custom setLabel method that stores the label
    column.setLabel = (text) => {
      column._label = text;
      // For now, just store the label - we'll display it differently
    };
    
    this._attachColumnKeyHandlers(column, index);
    
    return column;
  }
  
  _attachColumnKeyHandlers (column, columnIndex) {
    // Handle enter key at column level
    column.key(['enter'], () => this._handleEnterKey(columnIndex));
  }
  
  // ============================================================================
  // Navigation Handlers
  // ============================================================================
  
  _handleUpNavigation (column) {
    this._writeToLog(`Up navigation: current selected=${column.selected}, items=${column.items.length}`);
    if (column.selected > 0) {
      column.selected--;
      this._writeToLog(`Up navigation: new selected=${column.selected}`);
      this._renderColumnItems(column);
      this._screen.render();
    }
  }
  
  _handleDownNavigation (column) {
    this._writeToLog(`Down navigation: current selected=${column.selected}, items=${column.items.length}`);
    if (column.selected < column.items.length - 1) {
      column.selected++;
      this._writeToLog(`Down navigation: new selected=${column.selected}`);
      this._renderColumnItems(column);
      this._screen.render();
    }
  }
  
  _handleRightNavigation (columnIndex) {
    this._selectAndNavigate(columnIndex);
  }
  
  _handleEnterKey (columnIndex) {
    const selectedNode = this._getSelectedNode(columnIndex);
    if (!selectedNode) return;
    
    this._writeToLog(`Enter pressed on: ${selectedNode.title ? selectedNode.title() : selectedNode.type()}`);
    
    if (this._isEditableField(selectedNode)) {
      this._handleEditItem(columnIndex);
    } else {
      this._selectAndNavigate(columnIndex);
    }
  }
  
  _scrollColumn (column, offset) {
    const currentScroll = column.getScroll();
    column.scrollTo(currentScroll + offset);
    this._screen.render();
  }
  
  // ============================================================================
  // Key Handlers
  // ============================================================================
  
  _initializeKeyHandlers () {
    // Exit keys
    this._screen.key(['q', 'C-c'], () => this._handleExit());
    
    // Arrow key navigation - standard Miller Columns behavior
    this._screen.key(['up'], () => {
      const column = this._columns[this._focusedColumnIndex];
      if (column) {
        this._handleUpNavigation(column);
      }
    });
    
    this._screen.key(['down'], () => {
      const column = this._columns[this._focusedColumnIndex];
      if (column) {
        this._handleDownNavigation(column);
      }
    });
    
    this._screen.key(['left'], () => this._navigateLeft());
    this._screen.key(['right'], () => this._navigateRight());
    
    // Enter key selects/opens item
    this._screen.key(['enter'], () => {
      this._handleEnterKey(this._focusedColumnIndex);
    });
    
    this._screen.key(['tab'], () => this._navigateNextColumn());
    this._screen.key(['S-tab'], () => this._navigatePreviousColumn());
    
    // Edit keys
    this._screen.key(['e'], () => this._handleEdit());
    
    // Copy keys
    this._screen.key(['c'], () => this._copyCurrentItem());
    this._screen.key(['C'], () => this._copyAllText());
    
    // Log file key
    this._screen.key(['L'], () => this._openLogFile());
    
    // Help key
    this._screen.key(['?'], () => this._showHelp());
    
    // Debug key
    this._screen.key(['d'], () => this._showDebugInfo());
  }
  
  _handleExit () {
    this._writeToLog('Exit requested');
    process.stdout.write('\x1b[49m'); // Reset background color
    process.stdout.write('\x1b[?25h'); // Show cursor
    process.exit(0);
  }
  
  _navigateLeft () {
    if (this._focusedColumnIndex > 0) {
      this._changeFocus(this._focusedColumnIndex - 1);
    }
  }
  
  _navigateRight () {
    // Right arrow should select the current item and move to next column if it has children
    this._selectAndNavigate(this._focusedColumnIndex);
  }
  
  _navigateNextColumn () {
    for (let i = this._focusedColumnIndex + 1; i < this._columns.length; i++) {
      if (this._columns[i].items.length > 0) {
        this._changeFocus(i);
        break;
      }
    }
  }
  
  _navigatePreviousColumn () {
    for (let i = this._focusedColumnIndex - 1; i >= 0; i--) {
      if (this._columns[i].items.length > 0) {
        this._changeFocus(i);
        break;
      }
    }
  }
  
  _handleEdit () {
    this._handleEditItem(this._focusedColumnIndex);
  }
  
  // ============================================================================
  // Node Operations
  // ============================================================================
  
  _getNodeItems (node) {
    if (!node) {
      if (this._logFilePath) {
        this._writeToLog("_getNodeItems: node is null/undefined");
      }
      return [];
    }
    
    if (!node.subnodes || typeof node.subnodes !== 'function') {
      if (this._logFilePath) {
        this._writeToLog("_getNodeItems: node has no subnodes method, type: " + (node.type ? node.type() : "unknown"));
      }
      return [];
    }
    
    try {
      const subnodes = node.subnodes();
      if (this._logFilePath) {
        this._writeToLog(`_getNodeItems: Found ${subnodes.length} subnodes`);
      }
      return subnodes.map(subnode => this._formatNodeItem(subnode));
    } catch (e) {
      if (this._logFilePath) {
        this._writeToLog("Error getting subnodes: " + e.message);
      }
      return [];
    }
  }
  
  _formatNodeItem (subnode) {
    const title = subnode.title ? subnode.title() : subnode.type();
    const subtitle = subnode.subtitle ? subnode.subtitle() : '';
    const typeName = subnode.type ? subnode.type() : '';
    
    if (this._isFieldType(typeName)) {
      return this._formatFieldItem(subnode, title);
    } else if (this._isSummaryNode(subnode, typeName)) {
      return this._formatSummaryItem(subnode, title, subtitle);
    } else {
      return this._formatStandardItem(title, subtitle);
    }
  }
  
  _isFieldType (typeName) {
    return typeName.includes('SvField') || typeName.includes('Field');
  }
  
  _isSummaryNode (subnode, typeName) {
    return typeName.includes('SvSummaryNode') || 
           (subnode.title && subnode.subtitle);
  }
  
  _formatFieldItem (subnode, title) {
    let display = `{bold}${title}{/bold}`;
    const fieldValue = this._getFieldValue(subnode);
    
    if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
      display += `\n {gray-fg}${fieldValue}{/gray-fg}`;
    }
    
    return display;
  }
  
  _formatSummaryItem (subnode, title, subtitle) {
    let display = `{bold}${title}{/bold}`;
    const fieldValue = this._getFieldValue(subnode);
    
    if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
      display += `\n {gray-fg}${fieldValue}{/gray-fg}`;
    } else if (subtitle) {
      display += `\n{gray-fg}${subtitle}{/gray-fg}`;
    }
    
    return display;
  }
  
  _formatStandardItem (title, subtitle) {
    return subtitle ? `${title} (${subtitle})` : title;
  }
  
  _getFieldValue (node) {
    // Try various ways to get the value
    if (node.value && typeof node.value === 'function') {
      try {
        return node.value();
      } catch (e) {
        // Silent fallback
        console.error("Error getting field value for node: " + node.type() + " " + e.message);
      }
    }
    
    // Try direct property access
    const valueCandidates = ['_value', '_fieldValue', '_content', '_data', 'content', 'data'];
    for (const prop of valueCandidates) {
      if (node[prop] !== undefined) {
        return node[prop];
      }
    }
    
    return null;
  }
  
  _getSelectedNode (columnIndex) {
    const column = this._columns[columnIndex];
    if (!column || column.items.length === 0) return null;
    
    const selectedIndex = column.selected;
    let parentNode;
    
    if (columnIndex === 0) {
      parentNode = this._rootNode;
    } else {
      parentNode = this._currentPath[columnIndex - 1];
    }
    
    if (parentNode && parentNode.subnodes) {
      const subnodes = parentNode.subnodes();
      if (selectedIndex < subnodes.length) {
        return subnodes[selectedIndex];
      }
    }
    
    return null;
  }
  
  _isEditableField (node) {
    if (!node) return false;
    
    const typeName = node.type ? node.type() : '';
    const isField = typeName.includes('SvField') || typeName.includes('Field');
    
    return isField && 
           node.valueIsEditable && 
           typeof node.valueIsEditable === 'function' && 
           node.valueIsEditable();
  }
  
  // ============================================================================
  // Selection and Navigation
  // ============================================================================
  
  _selectItem (columnIndex) {
    const selectedNode = this._getSelectedNode(columnIndex);
    if (!selectedNode) return;
    
    // Update the path
    this._currentPath = this._currentPath.slice(0, columnIndex);
    this._currentPath.push(selectedNode);
    this._currentNode = selectedNode;
    
    // Update subsequent columns
    this._updateColumns(columnIndex + 1);
    this._updateBreadcrumb();
    this.render();
  }
  
  _selectAndNavigate (columnIndex) {
    this._selectItem(columnIndex);
    
    // Move focus to next column if it has items
    if (columnIndex + 1 < this._columns.length && 
        this._columns[columnIndex + 1].items.length > 0) {
      this._changeFocus(columnIndex + 1);
    }
  }
  
  _changeFocus (newIndex) {
    const oldFocusedColumn = this._columns[this._focusedColumnIndex];
    this._focusedColumnIndex = newIndex;
    const newFocusedColumn = this._columns[newIndex];
    
    newFocusedColumn.focus();
    
    // Re-render both columns to update selection colors
    this._renderColumnItems(oldFocusedColumn);
    this._renderColumnItems(newFocusedColumn);
  }
  
  // ============================================================================
  // Column Management
  // ============================================================================
  
  _updateColumns (startIndex) {
    // Clear columns from startIndex onwards
    for (let i = startIndex; i < this._columns.length; i++) {
      this._columns[i].setItems([]);
      this._columns[i].setLabel(' ');
    }
    
    // Special handling for the first column
    if (startIndex === 0) {
      const items = this._getNodeItems(this._rootNode);
      if (items.length > 0) {
        this._columns[0].setLabel(' Home ');
        this._columns[0].setItems(items);
      }
    }
    
    // Set items for the next column if we have a current node
    if (startIndex > 0 && startIndex < this._columns.length && this._currentNode) {
      const items = this._getNodeItems(this._currentNode);
      if (items.length > 0) {
        const nextColumn = this._columns[startIndex];
        const nodeTitle = this._currentNode.title ? this._currentNode.title() : this._currentNode.type();
        nextColumn.setLabel(' ' + nodeTitle.trim() + ' ');
        nextColumn.setItems(items);
      }
    }
  }
  
  _refreshColumnItems (column) {
    const columnIndex = this._columns.indexOf(column);
    if (columnIndex === -1) return;
    
    let parentNode;
    if (columnIndex === 0) {
      parentNode = this._rootNode;
    } else {
      parentNode = this._currentPath[columnIndex - 1];
    }
    
    if (parentNode) {
      const items = this._getNodeItems(parentNode);
      const currentSelection = column.selected;
      column.setItems(items);
      column.selected = Math.min(currentSelection, items.length - 1);
    }
  }
  
  // ============================================================================
  // Rendering
  // ============================================================================
  
  _renderColumnItems (column) {
    if (!column.items || column.items.length === 0) {
      column.setContent('');
      return;
    }
    
    const columnIndex = this._columns.indexOf(column);
    const isFocused = columnIndex === this._focusedColumnIndex;
    const columnWidth = Math.floor(this._screen.width * this._columnWidth / 100) - 2;
    
    const content = this._buildColumnContent(column, isFocused, columnWidth);
    column.setContent(content);
    
    // Ensure breadcrumb is always on top
    if (this._breadcrumb) {
      this._breadcrumb.setFront();
    }
  }
  
  _buildColumnContent (column, isFocused, columnWidth) {
    let content = '';
    
    // Debug logging
    this._writeToLog(`Building content for column: focused=${isFocused}, selected=${column.selected}, items=${column.items.length}`);
    
    column.items.forEach((item, index) => {
      const cleanItem = item.replace(/\n+$/, '');
      
      if (index === column.selected) {
        content += this._formatSelectedItem(cleanItem, isFocused, columnWidth);
      } else {
        content += `{/}{white-fg}${cleanItem}{/white-fg}`;
      }
      
      if (index < column.items.length - 1) {
        content += '\n\n';
      }
    });
    
    return content;
  }
  
  _formatSelectedItem (item, isFocused, columnWidth) {
    const lines = item.split('\n');
    const paddedLines = lines.map(line => {
      const strippedLine = this._stripBlessedTags(line);
      const padding = Math.max(0, columnWidth - strippedLine.length);
      return line + ' '.repeat(padding);
    });
    
    let formatted = '';
    
    paddedLines.forEach((line, lineIndex) => {
      if (isFocused) {
        // Focused column: gray background with white text
        formatted += `{gray-bg}{white-fg}${line}{/white-fg}{/gray-bg}`;
      } else {
        // Non-focused column: inverse (which gives a darker background)
        formatted += `{inverse}${line}{/inverse}`;
      }
      if (lineIndex < paddedLines.length - 1) {
        formatted += '\n';
      }
    });
    
    return formatted;
  }
  
  _updateBreadcrumb () {
    const breadcrumbText = this._buildBreadcrumbText();
    this._breadcrumb.setContent(breadcrumbText);
    this._breadcrumb.setFront();
    
    // Check if we need to adjust columns
    const neededColumns = this._currentPath.length + 2;
    const availableColumns = Math.floor(100 / this._columnWidth);
    
    if (neededColumns > availableColumns) {
      this._calculateColumnDimensions();
      this._createColumns();
    }
  }
  
  _buildBreadcrumbText () {
    let parts = [];
    
    if (this._rootNode && this._rootNode.title) {
      parts.push(this._rootNode.title());
    } else {
      parts.push('Home');
    }
    
    this._currentPath.forEach(node => {
      if (node && node.title) {
        parts.push(node.title());
      }
    });
    
    return ' ' + parts.join(' > ') + ' ';
  }
  
  render () {
    if (this._background) {
      this._background.setBack();
    }
    if (this._breadcrumb) {
      this._breadcrumb.setFront();
    }
    this._screen.render();
  }
  
  // ============================================================================
  // Edit Operations
  // ============================================================================
  
  _handleEditItem (columnIndex) {
    const selectedNode = this._getSelectedNode(columnIndex);
    if (!selectedNode) return;
    
    this._writeToLog(`Editing item: ${selectedNode.title ? selectedNode.title() : selectedNode.type()}`);
    
    if (this._isEditableField(selectedNode)) {
      this._editFieldValue(selectedNode, columnIndex);
    } else {
      this._showMessage('This item is not editable');
    }
  }
  
  _editFieldValue (fieldNode, columnIndex) {
    const currentValue = this._getFieldValue(fieldNode) || '';
    const title = fieldNode.title ? fieldNode.title() : 'Edit Value';
    
    const editBox = this._createEditBox(title, currentValue);
    
    editBox.on('submit', (value) => {
      this._handleEditSubmit(fieldNode, value, editBox, columnIndex);
    });
    
    editBox.on('cancel', () => {
      this._handleEditCancel(editBox);
    });
    
    this._screen.append(editBox);
    editBox.focus();
    this._screen.render();
  }
  
  _createEditBox (title, initialValue) {
    return blessed.textarea({
      top: 'center',
      left: 'center',
      width: '50%',
      height: 10,
      label: ` ${title} `,
      value: initialValue,
      border: {
        type: 'line',
        fg: 'cyan'
      },
      style: {
        fg: 'white',
        bg: '#111',
        border: {
          fg: 'cyan'
        }
      },
      scrollable: true,
      inputOnFocus: true,
      keys: true,
      mouse: true
    });
  }
  
  _handleEditSubmit (fieldNode, value, editBox, columnIndex) {
    try {
      this._writeToLog(`Setting value to: ${value}`);
      
      if (fieldNode.setValue && typeof fieldNode.setValue === 'function') {
        fieldNode.setValue(value);
      } else if (fieldNode._value !== undefined) {
        fieldNode._value = value;
      }
      
      this._screen.remove(editBox);
      this._refreshColumnItems(this._columns[columnIndex]);
      this._screen.render();
      
      this._writeToLog('Value updated successfully');
    } catch (error) {
      this._writeToLog('Error updating value: ' + error.message);
      this._showMessage(`Error: ${error.message}`);
    }
  }
  
  _handleEditCancel (editBox) {
    this._screen.remove(editBox);
    this._screen.render();
  }
  
  // ============================================================================
  // Clipboard Operations
  // ============================================================================
  
  _copyCurrentItem () {
    const column = this._columns[this._focusedColumnIndex];
    if (!column || column.items.length === 0) return;
    
    const selectedItemText = column.items[column.selected];
    const cleanText = this._stripBlessedTags(selectedItemText);
    
    this._copyToClipboard(cleanText, 'Copied current item to clipboard');
  }
  
  _copyAllText () {
    let allText = '';
    
    // Add breadcrumb
    if (this._breadcrumb && this._breadcrumb.content) {
      allText += this._stripBlessedTags(this._breadcrumb.content) + '\n\n';
    }
    
    // Add all visible columns
    this._columns.forEach((column, index) => {
      if (column.items && column.items.length > 0) {
        const label = column._label || `Column ${index + 1}`;
        allText += `${this._stripBlessedTags(label)}:\n`;
        
        column.items.forEach((item, itemIndex) => {
          const cleanText = this._stripBlessedTags(item);
          const prefix = itemIndex === column.selected ? '> ' : '  ';
          allText += prefix + cleanText.split('\n').join('\n  ') + '\n';
        });
        
        allText += '\n';
      }
    });
    
    this._copyToClipboard(allText, 'All visible text copied to clipboard');
  }
  
  _copyToClipboard (text, successMessage) {
    try {
      const { spawn } = require('child_process');
      const process = spawn('pbcopy');
      
      process.stdin.write(text);
      process.stdin.end();
      
      process.on('close', (code) => {
        if (code === 0) {
          this._showMessage(successMessage);
        } else {
          this._showMessage('Failed to copy to clipboard');
        }
      });
      
      process.on('error', (err) => {
        this._writeToLog('Clipboard error: ' + err.message);
        this._showMessage('Clipboard not available');
      });
    } catch (err) {
      this._writeToLog('Failed to access clipboard: ' + err.message);
      this._showMessage('Clipboard not available');
    }
  }
  
  // ============================================================================
  // Utility Methods
  // ============================================================================
  
  _stripBlessedTags (text) {
    if (typeof text !== 'string') return '';
    return text.replace(/\{[^}]*\}/g, '').trim();
  }
  
  _showMessage (message, duration = 3000) {
    if (this._messageBox) {
      this._screen.remove(this._messageBox);
    }
    
    this._messageBox = blessed.box({
      top: 'center',
      left: 'center',
      width: 'shrink',
      height: 'shrink',
      content: ` ${message} `,
      style: {
        fg: 'white',
        bg: '#333',
        border: {
          fg: 'yellow'
        }
      },
      border: {
        type: 'line'
      },
      tags: true
    });
    
    this._screen.append(this._messageBox);
    this._messageBox.setFront();
    this._screen.render();
    
    this.addTimeout(() => {
      if (this._messageBox) {
        this._screen.remove(this._messageBox);
        this._messageBox = null;
        this._screen.render();
      }
    }, duration);
  }
  
  _showHelp () {
    const helpText = `
 Miller Columns Browser - Help

 Navigation:
   ↑/k         - Move up in column
   ↓/j         - Move down in column
   ←/h         - Move to previous column
   →/l         - Move to next column
   Tab         - Next column with items
   Shift+Tab   - Previous column with items
   Enter       - Select item / Edit field
   
 Scrolling:
   Ctrl+d      - Scroll down
   Ctrl+u      - Scroll up
   Ctrl+f/PgDn - Page down
   Ctrl+b/PgUp - Page up
   
 Actions:
   e           - Edit current item
   c           - Copy current item
   C           - Copy all visible text
   L           - Open log file
   ?           - Show this help
   q/Ctrl+c    - Exit
   
 Debug:
   d           - Show debug info

 Press any key to close help`;
    
    const helpBox = blessed.box({
      top: 'center',
      left: 'center',
      width: '80%',
      height: '80%',
      content: helpText,
      style: {
        fg: 'white',
        bg: '#111',
        border: {
          fg: 'cyan'
        }
      },
      border: {
        type: 'line'
      },
      scrollable: true,
      keys: true,
      mouse: true
    });
    
    helpBox.key(['escape', 'q', 'enter', 'space'], () => {
      this._screen.remove(helpBox);
      this._screen.render();
    });
    
    this._screen.append(helpBox);
    helpBox.focus();
    this._screen.render();
  }
  
  _showDebugInfo () {
    let debugInfo = 'Debug Information\n\n';
    debugInfo += `Focused column index: ${this._focusedColumnIndex}\n`;
    debugInfo += `Number of columns: ${this._columns.length}\n`;
    debugInfo += `Current path length: ${this._currentPath.length}\n`;
    debugInfo += `Root node type: ${this._rootNode.type ? this._rootNode.type() : 'unknown'}\n`;
    debugInfo += `Current node type: ${this._currentNode.type ? this._currentNode.type() : 'unknown'}\n\n`;
    
    debugInfo += 'Column info:\n';
    this._columns.forEach((col, i) => {
      debugInfo += `  Column ${i}: ${col.items.length} items, selected: ${col.selected}\n`;
    });
    
    debugInfo += `\nLog file: ${this._logFilePath}\n`;
    debugInfo += '\nPress any key to close';
    
    const debugBox = blessed.box({
      top: 'center',
      left: 'center',
      width: '80%',
      height: '80%',
      content: debugInfo,
      style: {
        fg: 'white',
        bg: '#111',
        border: {
          fg: 'yellow'
        }
      },
      border: {
        type: 'line'
      },
      scrollable: true,
      keys: true,
      mouse: true,
      tags: true
    });
    
    debugBox.key(['escape', 'q', 'enter', 'space'], () => {
      this._screen.remove(debugBox);
      this._screen.render();
    });
    
    this._screen.append(debugBox);
    debugBox.focus();
    this._screen.render();
  }
  
  _openLogFile () {
    if (!this._logFilePath) {
      this._showMessage('No log file available');
      return;
    }
    
    const fs = require('fs');
    
    if (!fs.existsSync(this._logFilePath)) {
      this._showMessage('Log file not found');
      return;
    }
    
    try {
      const { spawn } = require('child_process');
      let openCommand;
      
      if (process.platform === 'darwin') {
        openCommand = spawn('open', [this._logFilePath]);
      } else if (process.platform === 'win32') {
        openCommand = spawn('start', [this._logFilePath], { shell: true });
      } else {
        openCommand = spawn('xdg-open', [this._logFilePath]);
      }
      
      openCommand.on('error', (err) => {
        this._writeToLog('Failed to open log file: ' + err.message);
        this._showMessage('Failed to open log file');
      });
      
      openCommand.on('close', (code) => {
        if (code === 0) {
          this._showMessage('Log file opened in external editor');
        }
      });
    } catch (err) {
      this._writeToLog('Error opening log file: ' + err.message);
      this._showMessage('Failed to open log file');
    }
  }
}

// Export for Node.js require
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SvCliBrowser;
}

// Also make the class available globally for STRVCT
if (typeof window !== 'undefined') {
  window.SvCliBrowser = SvCliBrowser;
} else if (typeof global !== 'undefined') {
  global.SvCliBrowser = SvCliBrowser;
}