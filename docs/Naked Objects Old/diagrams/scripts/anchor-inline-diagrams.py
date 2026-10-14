"""Generates the §4.6 diagrams. Usage: python3 anchor-inline-diagrams.py [outDir] (default ../svg).
Generates the §4.6 diagrams (anchor tabs, document inlining, presented node)
in the hand-written style of companion-view.svg: 1px black outlines, dashed
groupings, Helvetica 12px centered labels."""
import os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "svg")


class Svg:
    def __init__(self, w, h, title, desc):
        self.w, self.h, self.title, self.desc = w, h, title, desc
        self.shapes, self.texts = [], []

    def rect(self, x, y, w, h, dashed=False):
        dash = ' stroke-dasharray="3 3"' if dashed else ""
        self.shapes.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}"{dash}/>')

    def line(self, x1, y1, x2, y2, dashed=False, width=1):
        dash = ' stroke-dasharray="3 3"' if dashed else ""
        sw = f' stroke-width="{width}"' if width != 1 else ""
        self.shapes.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"{dash}{sw}/>')

    def path(self, d, dashed=False):
        dash = ' stroke-dasharray="3 3"' if dashed else ""
        self.shapes.append(f'<path d="{d}"{dash}/>')

    def arrow(self, x1, y1, x2, y2, dashed=False):
        self.line(x1, y1, x2, y2, dashed)
        # head pointing along the segment (horizontal or vertical only)
        if y1 == y2:
            s = 1 if x2 > x1 else -1
            self.texts.append(f'<path d="M{x2} {y2} L{x2 - 7 * s} {y2 - 4} L{x2 - 7 * s} {y2 + 4} Z" stroke="none"/>')
        else:
            s = 1 if y2 > y1 else -1
            self.texts.append(f'<path d="M{x2} {y2} L{x2 - 4} {y2 - 7 * s} L{x2 + 4} {y2 - 7 * s} Z" stroke="none"/>')

    def text(self, x, y, s, anchor="middle", size=12, weight=None, italic=False):
        extra = f' text-anchor="{anchor}"' if anchor != "middle" else ""
        if size != 12:
            extra += f' font-size="{size}px"'
        if weight:
            extra += f' font-weight="{weight}"'
        if italic:
            extra += ' font-style="italic"'
        s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        self.texts.append(f'<text x="{x}" y="{y}"{extra}>{s}</text>')

    def tile(self, x, y, w, h, label=None):
        self.rect(x, y, w, h)
        if label:
            self.text(x + w / 2, y + h / 2 + 4, label)

    def save(self, name):
        body = "\n    ".join(self.shapes)
        texts = "\n    ".join(self.texts)
        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="{self.w}px" height="{self.h}px" viewBox="-1 -1 {self.w + 2} {self.h + 2}" role="img" aria-labelledby="title desc">
  <title id="title">{self.title}</title>
  <desc id="desc">{self.desc}</desc>
  <defs/>
  <g fill="none" stroke="#000000" stroke-width="1" vector-effect="non-scaling-stroke">
    {body}
  </g>

  <g fill="#000000" font-family="Helvetica" font-size="12px" text-anchor="middle">
    {texts}
  </g>
</svg>
'''
        open(os.path.join(OUT, name), "w").write(svg)


def open_tab(s, x, y, w, label, pinned=False):
    """An open tab: raised, open at the bottom into the pane below it."""
    s.path(f"M{x} {y + 26} L{x} {y} L{x + w} {y} L{x + w} {y + 26}")
    s.text(x + w / 2, y + 17, label + (" ◆" if pinned else ""))
    if pinned:
        s.line(x + 10, y + 22, x + w - 10, y + 22, width=2)


def closed_tab(s, x, y, w, label):
    s.rect(x, y + 4, w, 20, dashed=True)
    s.text(x + w / 2, y + 18, label)


def pin_control(s, x, y):
    s.rect(x, y, 12, 12)
    s.text(x + 6, y + 10, "◆", size=8)


def divider(s, x, y):
    s.rect(x - 4, y, 8, 50)


# ---------------------------------------------------------------- anchored tabs, wide
def anchored_tabs_wide():
    W, H = 700, 290
    s = Svg(W, H, "Anchored Tabs (Wide)",
            "A row of tabs A to E over three side-by-side panes. Open tabs A, C and E each sit at the top left "
            "of their own pane; closed tabs B and D sit at the right end of the segment before the next open tab. "
            "Tab A is pinned. Draggable dividers separate the panes, and each pane has a pin control.")
    s.rect(0, 0, W, H)
    s.rect(0, 0, W, 30)
    s.text(W / 2, 19, "Breadcrumbs")
    s.line(0, 60, W, 60)                       # bottom of the tab row
    panes = [(0, 240), (240, 230), (470, 230)]  # x, width
    tabs = [("A", True, "B"), ("C", False, "D"), ("E", False, None)]
    for (px, pw), (openLabel, pinned, closedLabel) in zip(panes, tabs):
        s.rect(px, 60, pw, H - 60)              # the pane
        open_tab(s, px + 8, 34, 70, openLabel, pinned)
        if closedLabel:
            closed_tab(s, px + pw - 58, 34, 50, closedLabel)
        pin_control(s, px + pw - 20, 68)
    # pane A: a nav column and a detail view (its own traversal)
    s.rect(0, 60, 110, H - 60, dashed=True)
    s.tile(10, 90, 90, 30, "a1")
    s.tile(10, 130, 90, 30)
    s.tile(10, 170, 90, 30)
    s.tile(120, 90, 110, 190, None)
    s.text(175, 190, "Detail View")
    # pane C: a detail view
    s.tile(250, 90, 210, 190, None)
    s.text(355, 190, "Detail View")
    # pane E: a tile stack
    for i, label in enumerate(["e1", None, None, None]):
        s.tile(480, 90 + 40 * i, 200, 30, label)
    divider(s, 240, 150)
    divider(s, 470, 150)
    s.save("anchored-tabs-wide.svg")


# ---------------------------------------------------------------- anchored tabs, narrow
def anchored_tabs_narrow():
    W, H = 260, 290
    s = Svg(W, H, "Anchored Tabs (Narrow)",
            "The same tab row on a phone: only one pane fits, so the row behaves like ordinary tabs. "
            "Tab C is open over the single pane; the other tabs are closed and the row scrolls horizontally.")
    s.rect(0, 0, W, H)
    s.rect(0, 0, W, 30)
    s.text(W / 2, 19, "Breadcrumbs")
    s.line(0, 60, W, 60)
    closed_tab(s, 6, 34, 40, "A ◆")
    closed_tab(s, 52, 34, 34, "B")
    open_tab(s, 92, 34, 56, "C")
    closed_tab(s, 154, 34, 34, "D")
    closed_tab(s, 194, 34, 34, "E")
    s.text(W - 10, 51, "›")                     # the row scrolls
    s.rect(0, 60, W, H - 60)
    pin_control(s, W - 20, 68)
    s.tile(10, 90, W - 20, 190, None)
    s.text(W / 2, 190, "Detail View")
    s.save("anchored-tabs-narrow.svg")


# ---------------------------------------------------------------- inline document
def inline_document():
    W, H = 700, 330
    s = Svg(W, H, "Inline Document",
            "A node laid out inline: its subnodes become sections flowing in columns, one section spans every "
            "column, a section holds a nested group, and a tile that is not inlined opens the next column.")
    s.rect(0, 0, W, H)
    s.rect(0, 0, W, 30)
    s.text(W / 2, 19, "Breadcrumbs")
    # the nav column on the left, the document, the next column on the right
    s.rect(0, 30, 130, H - 30, dashed=True)
    s.tile(10, 40, 110, 30, "A")
    s.tile(10, 80, 110, 30, "Selected")
    s.tile(10, 120, 110, 30)
    s.rect(130, 30, 440, H - 30)                # the document's column
    s.rect(570, 30, 130, H - 30, dashed=True)   # the next column
    s.tile(580, 40, 110, H - 50, None)
    s.text(635, 185, "Detail View")

    def heading(x, y, w, label, nested=False):
        s.text(x, y, label, anchor="start", weight=None if nested else "bold", italic=nested)
        if not nested:
            s.line(x, y + 5, x + w, y + 5)

    def rows(x, y, w, n, labels=()):
        for i in range(n):
            label = labels[i] if i < len(labels) else None
            s.rect(x, y + 26 * i, w, 20)
            if label:
                s.text(x + 8, y + 26 * i + 14, label, anchor="start")
        return y + 26 * n

    # spanning section
    heading(142, 52, 416, "Section 1 (spans every column)")
    for i in range(3):
        s.rect(142 + 142 * i, 64, 132, 20)
    # three flowing columns
    cols = [142, 284, 426]
    for x in cols:
        s.rect(x - 4, 94, 140, H - 104, dashed=True)
    # column 1
    heading(cols[0], 112, 132, "Section 2")
    y = rows(cols[0], 122, 132, 3, ["key … value"])
    heading(cols[0], y + 22, 132, "Section 3")
    rows(cols[0], y + 32, 132, 2)
    # column 2: a section with a nested group
    heading(cols[1], 112, 132, "Section 4")
    y = rows(cols[1], 122, 132, 1)
    heading(cols[1] + 8, y + 16, 124, "Group", nested=True)
    y = rows(cols[1] + 8, y + 24, 124, 2)
    y = rows(cols[1], y + 6, 132, 1)
    # column 3: a section with a tile that is not inlined
    heading(cols[2], 112, 132, "Section 5")
    y = rows(cols[2], 122, 132, 2)
    s.rect(cols[2], y + 2, 132, 30)
    s.text(cols[2] + 8, y + 21, "Not inlined", anchor="start")
    s.text(cols[2] + 122, y + 21, "›")
    s.arrow(cols[2] + 132, y + 17, 578, y + 17)
    s.save("inline-document.svg")


# ---------------------------------------------------------------- layouts compared
def layouts_compared():
    W, H = 700, 230
    s = Svg(W, H, "Three Layouts of One Subtree",
            "The same node, with subnodes A, B and C where B has subnodes b1 and b2, laid out three ways: "
            "as columns (B opens the next column), as anchored tabs (A and B open side by side under their tabs), "
            "and as an inline document (A, B and C as sections in place).")
    pw, gap = 222, 17
    xs = [0, pw + gap, 2 * (pw + gap)]
    for x, label in zip(xs, ["Column", "Anchored Tabs", "Inline Document"]):
        s.text(x + pw / 2, 14, label)
        s.rect(x, 24, pw, H - 24)
    # column
    x = xs[0]
    s.rect(x, 24, 100, H - 24, dashed=True)
    s.tile(x + 10, 34, 80, 26, "A")
    s.tile(x + 10, 68, 80, 26, "B ›")
    s.tile(x + 10, 102, 80, 26, "C")
    s.rect(x + 100, 24, pw - 100, H - 24, dashed=True)
    s.tile(x + 110, 34, 102, 26, "b1")
    s.tile(x + 110, 68, 102, 26, "b2")
    # anchored tabs
    x = xs[1]
    s.line(x, 54, x + pw, 54)
    open_tab(s, x + 6, 28, 40, "A")
    open_tab(s, x + 117, 28, 40, "B")
    closed_tab(s, x + 170, 28, 40, "C")
    s.line(x + 111, 54, x + 111, H)
    s.tile(x + 8, 64, 95, H - 74, None)
    s.text(x + 55.5, 150, "A")
    s.tile(x + 119, 64, 95, 26, "b1")
    s.tile(x + 119, 98, 95, 26, "b2")
    # inline document
    x = xs[2]

    def section(sx, sy, label, n, labels=()):
        s.text(sx, sy, label, anchor="start", weight="bold")
        s.line(sx, sy + 5, sx + 95, sy + 5)
        for i in range(n):
            s.rect(sx, sy + 12 + 24 * i, 95, 18)
            if i < len(labels):
                s.text(sx + 8, sy + 12 + 24 * i + 13, labels[i], anchor="start")
        return sy + 12 + 24 * n

    y = section(x + 10, 44, "A", 2)
    section(x + 10, y + 18, "C", 1)
    section(x + 117, 44, "B", 2, ["b1", "b2"])
    s.save("layouts-compared.svg")


# ---------------------------------------------------------------- presented node
def presented_node():
    W, H = 700, 230
    s = Svg(W, H, "Presented Node",
            "A Character node presents a derived Sheet node. The Character stays on the navigation path, "
            "and its column shows the Sheet's subnodes laid out inline; the Sheet is re-derived when the Character changes.")

    def tree(x, title, root, children):
        s.text(x + 80, 14, title)
        s.tile(x, 24, 160, 30, root)
        for i, label in enumerate(children):
            s.line(x + 20, 54, x + 20, 79 + 36 * i)
            s.line(x + 20, 79 + 36 * i, x + 30, 79 + 36 * i)
            s.tile(x + 30, 64 + 36 * i, 130, 30, label)

    tree(10, "Model", "Character", ["Ability Scores", "Skills", "Inventory"])
    tree(290, "Derived", "Sheet", ["At a Glance", "Abilities", "Belongings"])
    s.arrow(170, 39, 288, 39)
    s.text(229, 32, "nodePresentedNode()", size=11)
    # the view: the character on the path, the sheet's subnodes inline in its column
    s.text(590, 14, "View")
    s.rect(480, 24, 220, H - 24)
    s.rect(480, 24, 84, H - 24, dashed=True)
    s.tile(486, 34, 72, 30, "Character")
    s.tile(486, 72, 72, 30)
    for i, label in enumerate(["At a Glance", "Abilities", "Belongings"]):
        y = 44 + 60 * i
        s.text(572, y, label, anchor="start", weight="bold")
        s.line(572, y + 5, 692, y + 5)
        s.rect(572, y + 12, 120, 15)
        s.rect(572, y + 31, 120, 15)
    s.arrow(450, 39, 478, 39, dashed=True)
    s.save("presented-node.svg")


anchored_tabs_wide()
anchored_tabs_narrow()
inline_document()
layouts_compared()
presented_node()
print("written to", OUT)
