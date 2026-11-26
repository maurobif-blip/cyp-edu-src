# ChildPicker

Ticking the children who took part in a group session or a group activity. The consumer provides the list of children with photo or initials, the registers to choose from, and what happens when the person saves.

- From top to bottom: the register (`Field` with a `select`), girls or boys (`Choice`: All, Girls, Boys), the name search (`Field`), a bar with the count and two buttons, then the list.
- The bar says how many are ticked (3 ticked) and holds Tick all with the number it will tick (Tick all 24) and Untick all. Tick all ticks the children the filters show, not the whole register.
- The list is a `CheckList` whose rows start with the photo or initials (`cyp-avatar`) before the name. Each row is at least 56px high and the whole row ticks the box.
- Ticked children move to the top of the list, then the others in alphabetical order. A child stays ticked when the filters hide them, and the count includes them.
- The picker sits in a `Sheet` on a phone, with Save as the one primary button. Save is disabled while no child is ticked.
