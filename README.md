# Strvct

Strvct is a client-side JavaScript framework for creating single page web applications using a [naked objects](https://en.wikipedia.org/wiki/Naked_objects) system in which only the domain model objects need to be defined and the user interfaces and storage are handled automatically.

## Why Naked Objects?

In his influential essay [The Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html), Rich Sutton observed that across 70 years of AI research, general methods that scale with computation consistently outperform approaches that try to encode human knowledge by hand. The same principle applies to user interfaces.

The conventional approach to UI development is to hand-craft bespoke screens for every domain object — custom forms, custom layouts, custom views. This is the equivalent of encoding human knowledge into the system. It looks polished early on, but it doesn't scale: every new model class or schema change carries a linear (or worse) UI cost.

The naked objects pattern is the bitter lesson applied to UI. Instead of hand-coding interfaces, the structure of the domain model itself drives the generation of the user interface. A generic, computation-driven method that scales automatically with the complexity of your data.

And just like Sutton's observation, the bitter part is that developers *want* to hand-craft UIs. It feels like the right thing to do — but the generic approach wins as a system grows.

Strvct takes this idea seriously. Slots describe the model, views are generated from the node hierarchy, and the inspector and tile system makes everything navigable without writing view code for each class. The framework *is* the general method — and the challenge it embraces is making that general method good enough that you rarely need to override it with hand-crafted specialization.

## More Information

See [strvct.net](https://strvct.net).