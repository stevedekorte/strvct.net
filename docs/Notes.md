First principles arguments for naked objects:

### Argument from User Interface Design Guidelines

In a naked objects system, as user interface components are no longer bespoke to the application, the major challenge is to find a small set of components which can efficiently express a large range of useful interface patterns. Strvct's perspective on this problem is that not just _possible_, but effectively _required_ for information-oriented user interfaces of complex domain models to follow user interface design guidelines such as:

- Consistency
- Accessibility
- Responsive layout
- Clear hierarchy and navigation
- User control and freedom

<!--
- Aesthetic and minimalist design
- Flexibility and efficiency of use
- Help users recognize, diagnose, and recover from errors
- Recognition rather than recall
- Visibility of system status

That is, each of these guidelines benefits from the use of a small set of of well chosen components. For example, a small set of components implies consistency, and this consistency supports clarity. User control and freedom is difficult to achieve when each action requires a separate implementation but is supported by default when the system is only composed of a few components with a common protocol e.g. reordering and drag-and-drop is supported everywhere one finds a list in Strvct. Accessibiliy is also easier when these few components support it e.g. all navigation supports keyboard control. Likewise, responsiveness is easier when the system is composed of nested visual components which can follow simple rules to automatically adapt to the viewport size.
  -->

These guidelines can be challenging to achieve when a system is saddled with a large number of disparate bespoke components commonly found in traditional systems, for a domain model of any complexity. Therefore, greatly reducing the number of visual components by finding a small set of well composable ones may be the only practical way to achieve these goals.

### Argument from Software Development Goals

Some well accepted major goals for software development systems include: Efficiency, Quality, Scalability, Maintainability, Security, Performance, Compatibility, Cost-effectiveness, Flexibility.

- As each of these goals strongly benefits from reuse, reuse may be the most important subgoal.
- As the minimum custom code for an app would be a specification of the domain model, reuse is maximized when the domain model is the only custom code.

Therefore, an ideal framework should (if possible) only require a description of the domain model. This is exactly what naked objects systems limit themselves to defining. Even if we have not yet found a way to make this ideal practical for end-user applications, it is clearly the goal to aim for.
