/*
APS V3 Regression scenarios.
Manual/Node-oriented reference tests for the coaching logic.

Expected coaching behavior:
1) 6 Drivers, 2 right, all Fairway, 0 penalty:
   => Abschlag-Richtung must NOT be a Top-3 priority.
2) 6 Drivers, 2 right, both Recovery:
   => Abschlag-Richtung may become a priority.
3) 6 Drivers, 2 right, 1 penalty / 1 out:
   => high priority.
4) 8 long-game shots, 5 thin/fat, 3 recovery/penalty:
   => long-game ball contact should outrank harmless short-game noise.
5) 8 putts, 5 poor lags creating 3 three-putts:
   => putting distance control high priority.
6) Only one isolated bad chip in otherwise stable round:
   => no forced Top-3 short-game priority.
*/
console.log("APS V3 regression scenarios documented.");
