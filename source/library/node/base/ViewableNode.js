"use strict";

/*

    ViewableNode
 
    BMNode -> TitledNode -> ActionableNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    Class for handling a node's connection to the user interface.
    Views can reference nodes, but nodes should not reference views. 
    Views can query nodes for info or tell them to take actions, but otherwise 
    nodes should only communicate with views via notfications.

*/

(class ViewableNode extends InspectableNode {
    
}.initThisClass());




