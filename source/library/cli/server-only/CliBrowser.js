const blessed = require('blessed');

class CliBrowser {
  constructor(data, options = {}) {
    this.data = data;
    this.columns = [];
    this.currentPath = [];
    this.currentData = data;
    this.focusedColumnIndex = 0;
    this.defaultColumnWidth = options.columnWidth || 45;
    
    this.initializeScreen();
    this.createBreadcrumb();
    this.calculateColumns();
    this.createColumns();
    this.setupKeyHandlers();
    this.render();
  }

  initializeScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Miller Columns Browser'
    });
  }

  createBreadcrumb() {
    this.breadcrumb = blessed.text({
      top: 0,
      left: 0,
      width: '100%',
      height: 1,
      content: 'Home',
      style: {
        fg: 'black'
      }
    });
    this.screen.append(this.breadcrumb);
  }

  calculateColumns() {
    const screenWidth = this.screen.width;
    this.maxColumns = Math.max(2, Math.floor(screenWidth / this.defaultColumnWidth));
    this.columnWidth = Math.floor(100 / this.maxColumns);
  }

  createColumns() {
    // Clear existing columns
    this.columns.forEach(column => {
      this.screen.remove(column);
    });
    this.columns = [];

    // Create new columns based on screen width
    for (let i = 0; i < this.maxColumns; i++) {
      const column = blessed.list({
        top: 1,
        left: `${i * this.columnWidth}%`,
        width: `${this.columnWidth}%`,
        height: '100%-1',
        label: i === 0 ? ' Home ' : ' ',
        border: {
          type: 'line'
        },
        style: {
          fg: 'black',
          border: {
            fg: 'black'
          },
          selected: {
            bg: 'gray',
            fg: 'black'
          },
          focus: {
            selected: {
              bg: 'gray',
              fg: 'white'
            }
          }
        },
        keys: true,
        vi: true,
        mouse: true,
        keyable: false,
        items: i === 0 ? Object.keys(this.data) : []
      });

      this.columns.push(column);
      this.screen.append(column);
    }

    // Focus first column
    if (this.columns.length > 0) {
      this.columns[0].focus();
      this.focusedColumnIndex = 0;
    }
  }

  selectItem(columnIndex) {
    if (columnIndex >= this.columns.length || this.columns[columnIndex].items.length === 0) {
      return;
    }

    const column = this.columns[columnIndex];
    const selected = column.getItem(column.selected).getText();
    
    if (columnIndex === 0) {
      this.currentPath = [selected];
      this.currentData = this.data[selected];
    } else {
      this.currentPath = this.currentPath.slice(0, columnIndex);
      this.currentPath.push(selected);
      
      // Navigate to the selected data
      let tempData = this.data;
      for (let i = 0; i < this.currentPath.length; i++) {
        tempData = tempData[this.currentPath[i]];
      }
      this.currentData = tempData;
    }

    // Update subsequent columns
    this.updateColumns(columnIndex + 1);
    this.updateBreadcrumb();
    this.render();
  }

  selectAndNavigate(columnIndex) {
    this.selectItem(columnIndex);
    
    // Move focus to next column if it has items
    if (columnIndex + 1 < this.columns.length && this.columns[columnIndex + 1].items.length > 0) {
      this.focusedColumnIndex = columnIndex + 1;
      this.columns[columnIndex + 1].focus();
    }
  }

  updateColumns(startIndex) {
    // Clear columns from startIndex onwards
    for (let i = startIndex; i < this.columns.length; i++) {
      this.columns[i].setItems([]);
      this.columns[i].setLabel(' ');
    }

    // Update the next column if we have data
    if (startIndex < this.columns.length && this.currentData && typeof this.currentData === 'object') {
      const nextColumn = this.columns[startIndex];
      const items = Object.keys(this.currentData);
      
      if (items.length > 0) {
        nextColumn.setItems(items);
        nextColumn.select(0);
        nextColumn.setLabel(' ' + this.currentPath[this.currentPath.length - 1] + ' ');
      }
    }
  }

  updateBreadcrumb() {
    const breadcrumbText = this.currentPath.length > 0 
      ? 'Home > ' + this.currentPath.join(' > ')
      : 'Home';
    this.breadcrumb.setContent(breadcrumbText);
  }

  handleFinalSelection() {
    if (this.focusedColumnIndex >= this.columns.length) return;
    
    const column = this.columns[this.focusedColumnIndex];
    if (column.items.length === 0) return;
    
    const selected = column.getItem(column.selected).getText();
    const fullPath = [...this.currentPath, selected];
    
    this.breadcrumb.setContent('Home > ' + fullPath.join(' > '));
    this.render();
    
    setTimeout(() => {
      this.screen.destroy();
      console.log('Selected:', fullPath.join(' > '));
      process.exit(0);
    }, 500);
  }

  setupKeyHandlers() {
    // Left arrow - move focus left
    this.screen.key(['left'], () => {
      if (this.focusedColumnIndex > 0) {
        this.focusedColumnIndex--;
        this.columns[this.focusedColumnIndex].focus();
        this.render();
      }
    });

    // Right arrow - select and navigate right
    this.screen.key(['right'], () => {
      this.selectAndNavigate(this.focusedColumnIndex);
    });

    // Enter - select without navigation
    this.screen.key(['enter'], () => {
      const column = this.columns[this.focusedColumnIndex];
      
      // Check if this is a final selection (no more data to navigate)
      if (this.focusedColumnIndex < this.columns.length - 1) {
        this.selectItem(this.focusedColumnIndex);
      } else {
        this.handleFinalSelection();
      }
    });

    // Resize handler
    this.screen.on('resize', () => {
      this.calculateColumns();
      this.createColumns();
      this.updateColumnsFromPath();
      this.render();
    });

    // Quit handlers
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.screen.destroy();
      process.exit(0);
    });
  }

  updateColumnsFromPath() {
    // Rebuild columns based on current path
    let tempData = this.data;
    
    // Set first column
    if (this.columns.length > 0) {
      this.columns[0].setItems(Object.keys(this.data));
      this.columns[0].setLabel(' Home ');
    }

    // Rebuild path
    for (let i = 0; i < this.currentPath.length && i < this.columns.length - 1; i++) {
      const pathItem = this.currentPath[i];
      tempData = tempData[pathItem];
      
      if (tempData && typeof tempData === 'object' && i + 1 < this.columns.length) {
        this.columns[i + 1].setItems(Object.keys(tempData));
        this.columns[i + 1].setLabel(' ' + pathItem + ' ');
      }
    }

    // Set focus to appropriate column
    this.focusedColumnIndex = Math.min(this.focusedColumnIndex, this.columns.length - 1);
    if (this.columns[this.focusedColumnIndex]) {
      this.columns[this.focusedColumnIndex].focus();
    }
  }

  render() {
    this.screen.render();
  }
}

module.exports = CliBrowser;