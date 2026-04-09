(function () {
  const STORAGE_KEY = "math-masters-progress-v5";
  const ACCOUNTS_KEY = "math-masters-accounts-v1";
  const GRADE_PATHS = [
    { id: "grade6", label: "Grade 6", title: "6th Grade Foundations", description: "Ratios, fractions, decimals, expressions, area, and early statistics." },
    { id: "grade7", label: "Grade 7", title: "7th Grade", description: "Rational numbers, proportional relationships, equations, probability, and geometry." },
    { id: "grade7acc", label: "7th Accelerated", title: "7th Grade Accelerated Track", description: "Public-sequence alignment for accelerated Big Ideas style lessons plus early algebra previews." },
    { id: "grade8", label: "Grade 8", title: "8th Grade Preview", description: "Transformations, slope, linear relationships, and irrational-number foundations." }
  ];
  const STRANDS = [
    { id: "all", label: "All Skills" },
    { id: "numbers", label: "Integers and Rational Numbers" },
    { id: "arithmetic", label: "Computation and Fluency" },
    { id: "proportions", label: "Ratios and Rates" },
    { id: "finance", label: "Percents and Finance" },
    { id: "equations", label: "Expressions and Equations" },
    { id: "word-problems", label: "Word Problems" },
    { id: "geometry", label: "Geometry" },
    { id: "measurement", label: "Area, Surface Area, and Volume" },
    { id: "data", label: "Probability and Statistics" },
    { id: "transformations", label: "Transformations and Coordinates" },
    { id: "coordinate-plane", label: "Coordinate Plane" },
    { id: "inequality-graphs", label: "Inequalities and Graphs" },
    { id: "functions", label: "Functions and Patterns" },
    { id: "accelerated", label: "Advanced Algebra Preview" }
  ];
  const MODES = [
    { id: "warmup", label: "Warm-up" },
    { id: "onlevel", label: "On-Level" },
    { id: "challenge", label: "Challenge" }
  ];
  const MEDALS = [
    { id: "bronze", label: "Bronze", minScore: 0, next: "Silver" },
    { id: "silver", label: "Silver", minScore: 180, next: "Gold" },
    { id: "gold", label: "Gold", minScore: 420, next: "Platinum" },
    { id: "platinum", label: "Platinum", minScore: 760, next: "Diamond" },
    { id: "diamond", label: "Diamond", minScore: 1150, next: "Maxed tier" }
  ];
  const DAILY_GOALS = [
    { id: "xp", label: "Earn 60 XP", target: 60 },
    { id: "lessons", label: "Start 2 lessons", target: 2 },
    { id: "challengeClears", label: "Clear 1 challenge quest", target: 1 }
  ];
  const SUPABASE_URL = "https://jbljqusdpifdyewlenun.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibGpxdXNkcGlmZHlld2xlbnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODY5NTUsImV4cCI6MjA5MTI2Mjk1NX0.jwpLv3AtXP0PGdoOSSkhruDAY8vdJzcxklu-PauTjSE";
  const SUPABASE_TABLE = "math_masters_leaderboard";
  const PREREQUISITES = {
    "g7-composite-area": ["g6-area"],
    "g7-surface-area": ["g7-scale"],
    "g7a-volume": ["g7a-surface-area"],
    "g7a-slope": ["g7a-linear-patterns"],
    "g7a-function-table": ["g7a-linear-patterns"],
    "g8-scientific-notation": ["g8-square-roots"],
    "g8-pythagorean-preview": ["g8-translation-image"]
  };
  const TEACHING_CARDS = {
    numbers: {
      title: "Signed Number Strategy",
      summary: "Use a number line or think in gains and losses. Combining a negative with a positive depends on which has the larger absolute value.",
      example: "Example: -8 + 13 = 5 because you move 13 units right from -8."
    },
    proportions: {
      title: "Rate and Ratio Thinking",
      summary: "Match multiplicative relationships, not additive ones. Equivalent ratios scale by the same factor.",
      example: "Example: 3/5 = 9/15 because both parts were multiplied by 3."
    },
    finance: {
      title: "Percent Problem Structure",
      summary: "Convert percent to decimal, apply it to the original amount, then adjust the total carefully in order.",
      example: "Example: 20% off $50 means subtract 0.20 x 50 = 10, so the sale price is $40."
    },
    equations: {
      title: "Undo in Reverse Order",
      summary: "To solve an equation, reverse the operations one step at a time while keeping both sides balanced.",
      example: "Example: 3x + 5 = 20 becomes 3x = 15, then x = 5."
    },
    "word-problems": {
      title: "Model the Story",
      summary: "Name the unknown, write the equation from the story, then solve and check whether the answer makes sense.",
      example: "Example: total cost = ticket price x number of tickets + fixed fee."
    },
    geometry: {
      title: "Geometry Relationships",
      summary: "Look for definitions and angle rules first: straight angles add to 180, full rotations add to 360, and circles use radius and diameter relationships.",
      example: "Example: if one angle on a straight line is 68°, the other is 112°."
    },
    measurement: {
      title: "Break Shapes Into Parts",
      summary: "For area, surface area, and volume, label the dimensions clearly and combine simpler shapes when needed.",
      example: "Example: composite area = rectangle A + rectangle B."
    },
    data: {
      title: "Describe the Pattern",
      summary: "In statistics, compute carefully and interpret the meaning. In probability, compare favorable outcomes to total outcomes.",
      example: "Example: MAD tells the average distance from the mean."
    },
    transformations: {
      title: "Track the Coordinates",
      summary: "Translations add moves, reflections flip signs across an axis, and rotations follow coordinate rules around the origin.",
      example: "Example: reflecting (4, -1) across the y-axis gives (-4, -1)."
    },
    "coordinate-plane": {
      title: "Coordinate Grid Moves",
      summary: "Horizontal movement changes x and vertical movement changes y. Distance on a horizontal or vertical line is the absolute difference.",
      example: "Example: from (2, 5) to (2, -1) is 6 units."
    },
    "inequality-graphs": {
      title: "Boundary and Direction",
      summary: "Identify the boundary value first, then decide whether the solutions are greater than or less than that point.",
      example: "Example: x > 4 means the least integer solution is 5."
    },
    functions: {
      title: "Input to Output Rule",
      summary: "A function applies one rule to every input. Substitute carefully and watch for constant rate of change.",
      example: "Example: if y = 3x + 2, then x = 4 gives y = 14."
    },
    accelerated: {
      title: "Preview the Next Level",
      summary: "Accelerated topics connect patterns, real numbers, and algebra. Look for structure before computing.",
      example: "Example: perfect square roots connect areas to side lengths."
    }
  };

  function skill(id, grade, chapter, lesson, strand, unit, name, standard, alignment, description, generate) {
    return { id, grade, chapter, lesson, strand, unit, name, standard, alignment, description, generate };
  }

  const SKILLS = [
    skill("g6-ratio-table", "grade6", "2", "2.2", "proportions", "Chapter 2: Ratios", "Equivalent Ratio Tables", "6.RP style ratio reasoning", "Original practice aligned to a public-style ratio lesson flow.", "Fill missing values in equivalent ratio tables.", ratioTableQuestion),
    skill("g6-unit-rate", "grade6", "2", "2.4", "proportions", "Chapter 2: Ratios", "Unit Rates", "6.RP style unit rate work", "Original practice aligned to a public-style ratio lesson flow.", "Find the unit rate in a real-life situation.", unitRateQuestion),
    skill("g6-decimal-ops", "grade6", "3", "3.3", "arithmetic", "Chapter 3: Decimals and Fractions", "Decimal Operations", "6.NS style decimal computation", "Original practice aligned to a public-style arithmetic lesson flow.", "Add, subtract, multiply, and divide decimals.", decimalOperationQuestion),
    skill("g6-fraction-multiply", "grade6", "3", "3.6", "arithmetic", "Chapter 3: Decimals and Fractions", "Multiply Fractions", "6.NS style fraction computation", "Original practice aligned to a public-style fraction lesson flow.", "Multiply fractions and mixed values with friendly numbers.", fractionMultiplyQuestion),
    skill("g6-fraction-divide", "grade6", "3", "3.7", "arithmetic", "Chapter 3: Decimals and Fractions", "Divide Fractions", "6.NS style fraction division", "Original practice aligned to a public-style fraction lesson flow.", "Divide fractions using reciprocal reasoning.", fractionDivideQuestion),
    skill("g6-expressions", "grade6", "6", "6.1", "equations", "Chapter 6: Expressions and Equations", "Evaluate Expressions", "6.EE style expression work", "Original practice aligned to a public-style expressions lesson flow.", "Substitute values into simple expressions.", expressionEvaluationQuestion),
    skill("g6-area", "grade6", "9", "9.1", "measurement", "Chapter 9: Area", "Area of Triangles", "6.G style area reasoning", "Original practice aligned to a public-style geometry lesson flow.", "Find triangle area from base and height.", triangleAreaQuestion),
    skill("g6-mean", "grade6", "11", "11.2", "data", "Chapter 11: Statistics", "Mean of a Data Set", "6.SP style statistics", "Original practice aligned to a public-style statistics lesson flow.", "Compute the mean of a small data set.", meanQuestion),
    skill("g7-int-add", "grade7", "1", "1.2", "numbers", "Chapter 1: Rational Numbers", "Adding Integers", "7.NS style signed number work", "Original practice aligned to a public-style Grade 7 lesson flow.", "Practice addition with positive and negative integers.", integerAddQuestion),
    skill("g7-int-sub", "grade7", "1", "1.4", "numbers", "Chapter 1: Rational Numbers", "Subtracting Integers", "7.NS style signed number work", "Original practice aligned to a public-style Grade 7 lesson flow.", "Practice subtraction with positive and negative integers.", integerSubtractQuestion),
    skill("g7-rational-add-sub", "grade7", "1", "1.5", "numbers", "Chapter 1: Rational Numbers", "Add and Subtract Rational Numbers", "7.NS style rational-number work", "Original practice aligned to a public-style Grade 7 lesson flow.", "Add and subtract signed decimals.", rationalAddSubtractQuestion),
    skill("g7-rational-convert", "grade7", "1", "1.7", "numbers", "Chapter 1: Rational Numbers", "Fraction Decimal Conversion", "7.NS rational-number fluency", "Original practice aligned to a public-style Grade 7 lesson flow.", "Convert fractions and decimals in useful benchmark forms.", fractionDecimalConversionQuestion),
    skill("g7-proportionality", "grade7", "4", "4.2", "proportions", "Chapter 4: Proportional Relationships", "Constant of Proportionality", "7.RP proportional reasoning", "Original practice aligned to a public-style Grade 7 lesson flow.", "Use tables to find proportional values.", proportionalTableQuestion),
    skill("g7-percent", "grade7", "5", "5.2", "finance", "Chapter 5: Percent", "Percent Increase and Decrease", "7.RP percent problem solving", "Original practice aligned to a public-style Grade 7 lesson flow.", "Solve discount and growth questions.", percentChangeQuestion),
    skill("g7-tax-tip", "grade7", "5", "5.4", "finance", "Chapter 5: Percent", "Tax, Tip, and Total Cost", "7.RP percent applications", "Original practice aligned to a public-style Grade 7 lesson flow.", "Find final totals using tax and tip.", taxTipQuestion),
    skill("g7-two-step", "grade7", "6", "6.4", "equations", "Chapter 6: Equations and Inequalities", "Two-Step Equations", "7.EE equation solving", "Original practice aligned to a public-style Grade 7 lesson flow.", "Solve equations with two inverse-operation steps.", twoStepEquationQuestion),
    skill("g7-inequalities", "grade7", "6", "6.5", "equations", "Chapter 6: Equations and Inequalities", "Inequalities", "7.EE inequality reasoning", "Original practice aligned to a public-style Grade 7 lesson flow.", "Find values that satisfy an inequality.", inequalityQuestion),
    skill("g7-both-sides", "grade7", "6", "6.6", "equations", "Chapter 6: Equations and Inequalities", "Variables on Both Sides", "7.EE equation solving", "Original practice aligned to a public-style Grade 7 lesson flow.", "Solve linear equations with variables on both sides.", variablesBothSidesQuestion),
    skill("g7-word-problem", "grade7", "6", "6.7", "word-problems", "Chapter 6: Equations and Inequalities", "Equation Word Problems", "7.EE real-world equation modeling", "Original practice aligned to a public-style Grade 7 lesson flow.", "Set up and solve a real-world equation.", equationWordProblemQuestion),
    skill("g7-percent-error", "grade7", "8", "8.4", "data", "Chapter 8: Statistics", "Mean Absolute Deviation", "7.SP variability reasoning", "Original practice aligned to a public-style Grade 7 lesson flow.", "Compare a data set to its mean using distances.", meanAbsoluteDeviationQuestion),
    skill("g7-probability", "grade7", "7", "7.1", "data", "Chapter 7: Probability", "Experimental Probability", "7.SP probability", "Original practice aligned to a public-style Grade 7 lesson flow.", "Find a simple probability as a decimal.", probabilityQuestion),
    skill("g7-scale", "grade7", "9", "9.3", "measurement", "Chapter 9: Geometry", "Scale Drawings", "7.G scale reasoning", "Original practice aligned to a public-style Grade 7 lesson flow.", "Use scale factors to find actual lengths.", scaleDrawingQuestion),
    skill("g7-angles", "grade7", "9", "9.5", "geometry", "Chapter 9: Geometry", "Angle Relationships", "7.G angle problem solving", "Original practice aligned to a public-style Grade 7 lesson flow.", "Solve for unknown angle measures.", angleRelationshipQuestion),
    skill("g7-coordinate-distance", "grade7", "9", "9.6", "coordinate-plane", "Chapter 9: Geometry", "Coordinate Distance", "7.G coordinate plane reasoning", "Original practice aligned to a public-style Grade 7 lesson flow.", "Use coordinate differences to find distance on the grid.", coordinateDistanceQuestion),
    skill("g7-circle", "grade7", "9", "9.1", "geometry", "Chapter 9: Geometry", "Circles and Area", "7.G circle measurement", "Original practice aligned to a public-style Grade 7 lesson flow.", "Use pi = 3.14 for circumference and area.", circleQuestion),
    skill("g7-surface-area", "grade7", "10", "10.1", "measurement", "Chapter 10: Surface Area and Volume", "Surface Area of Prisms", "7.G surface area", "Original practice aligned to a public-style Grade 7 lesson flow.", "Find rectangular prism surface area.", surfaceAreaQuestion),
    skill("g7a-int-add", "grade7acc", "1", "1.2", "numbers", "Chapter 1: Adding and Subtracting Rational Numbers", "Adding Integers", "7.NS style signed number work", "Public-sequence match for accelerated Chapter 1.", "Practice addition with positive and negative integers.", integerAddQuestion),
    skill("g7a-rational-sub", "grade7acc", "1", "1.5", "numbers", "Chapter 1: Adding and Subtracting Rational Numbers", "Subtracting Rational Numbers", "7.NS style rational-number work", "Public-sequence match for accelerated Chapter 1.", "Add and subtract signed decimals in a rational-number setting.", rationalAddSubtractQuestion),
    skill("g7a-multiply-rationals", "grade7acc", "2", "2.3", "numbers", "Chapter 2: Multiplying and Dividing Rational Numbers", "Multiplying Rational Numbers", "7.NS style rational-number work", "Public-sequence match for accelerated Chapter 2.", "Multiply decimals and signed rational values.", rationalMultiplyQuestion),
    skill("g7a-divide-rationals", "grade7acc", "2", "2.5", "numbers", "Chapter 2: Multiplying and Dividing Rational Numbers", "Dividing Rational Numbers", "7.NS style rational-number work", "Public-sequence match for accelerated Chapter 2.", "Divide decimals and rational numbers with clean quotients.", divideRationalsQuestion),
    skill("g7a-convert-rationals", "grade7acc", "2", "2.6", "numbers", "Chapter 2: Multiplying and Dividing Rational Numbers", "Fraction Decimal Conversion", "7.NS rational-number fluency", "Public-sequence match for accelerated Chapter 2.", "Convert benchmark fractions and decimals in context.", fractionDecimalConversionQuestion),
    skill("g7a-equivalent-exp", "grade7acc", "3", "3.2", "equations", "Chapter 3: Algebraic Expressions", "Equivalent Expressions", "7.EE style expression rewriting", "Public-sequence match for accelerated Chapter 3.", "Evaluate and simplify equivalent expressions.", equivalentExpressionsQuestion),
    skill("g7a-unit-rate", "grade7acc", "4", "4.1", "proportions", "Chapter 4: Ratios and Proportional Relationships", "Unit Rate Reasoning", "7.RP proportional reasoning", "Public-sequence match for accelerated Chapter 4.", "Turn rates into a 1-unit comparison.", unitRateQuestion),
    skill("g7a-constant-prop", "grade7acc", "4", "4.2", "proportions", "Chapter 4: Ratios and Proportional Relationships", "Constant of Proportionality", "7.RP proportional reasoning", "Public-sequence match for accelerated Chapter 4.", "Use tables and ratios to find missing values.", proportionalTableQuestion),
    skill("g7a-percent", "grade7acc", "5", "5.2", "finance", "Chapter 5: Percent and Proportional Problem Solving", "Percent Increase and Decrease", "7.RP percent problem solving", "Public-sequence match for accelerated Chapter 5.", "Solve markup, discount, and percent change questions.", percentChangeQuestion),
    skill("g7a-tax-tip", "grade7acc", "5", "5.4", "finance", "Chapter 5: Percent and Proportional Problem Solving", "Tax, Tip, and Total Cost", "7.RP percent applications", "Public-sequence match for accelerated Chapter 5.", "Work with final price, tax, and tip situations.", taxTipQuestion),
    skill("g7a-eval-exp", "grade7acc", "6", "6.1", "equations", "Chapter 6: Equations and Inequalities", "Writing and Evaluating Expressions", "7.EE expression work", "Public-sequence match for accelerated Chapter 6.", "Substitute values and simplify expressions.", expressionEvaluationQuestion),
    skill("g7a-two-step", "grade7acc", "6", "6.4", "equations", "Chapter 6: Equations and Inequalities", "Two-Step Equations", "7.EE equation solving", "Public-sequence match for accelerated Chapter 6.", "Solve equations with two inverse-operation steps.", twoStepEquationQuestion),
    skill("g7a-ineq", "grade7acc", "6", "6.5", "equations", "Chapter 6: Equations and Inequalities", "Inequality Solutions", "7.EE inequality reasoning", "Public-sequence match for accelerated Chapter 6.", "Find values that make an inequality true.", inequalityQuestion),
    skill("g7a-both-sides", "grade7acc", "6", "6.6", "equations", "Chapter 6: Equations and Inequalities", "Variables on Both Sides", "7.EE linear equation solving", "Public-sequence match for accelerated Chapter 6.", "Solve linear equations with variables on both sides.", variablesBothSidesQuestion),
    skill("g7a-word-problem", "grade7acc", "6", "6.7", "word-problems", "Chapter 6: Equations and Inequalities", "Equation Word Problems", "7.EE real-world equation modeling", "Public-sequence match for accelerated Chapter 6.", "Model and solve a real-world equation.", equationWordProblemQuestion),
    skill("g7a-graph-ineq", "grade7acc", "6", "6.8", "inequality-graphs", "Chapter 6: Equations and Inequalities", "Inequalities on a Number Line", "7.EE inequality graph interpretation", "Public-sequence match for accelerated Chapter 6.", "Interpret a graphed inequality and identify a boundary value.", inequalityGraphQuestion),
    skill("g7a-probability", "grade7acc", "7", "7.1", "data", "Chapter 7: Probability", "Experimental Probability", "7.SP probability models", "Public-sequence match for accelerated Chapter 7.", "Compare outcomes and compute simple probabilities.", probabilityQuestion),
    skill("g7a-mean", "grade7acc", "8", "8.2", "data", "Chapter 8: Statistics", "Mean and Distance", "7.SP statistical thinking", "Public-sequence match for accelerated Chapter 8.", "Find the mean of a small data set.", meanQuestion),
    skill("g7a-mad", "grade7acc", "8", "8.4", "data", "Chapter 8: Statistics", "Mean Absolute Deviation", "7.SP variability reasoning", "Public-sequence match for accelerated Chapter 8.", "Measure variability by average distance from the mean.", meanAbsoluteDeviationQuestion),
    skill("g7a-circle", "grade7acc", "9", "9.1", "geometry", "Chapter 9: Geometry", "Circles and Area", "7.G circle measurement", "Public-sequence match for accelerated Chapter 9.", "Use pi = 3.14 to find circumference or area.", circleQuestion),
    skill("g7a-scale", "grade7acc", "9", "9.3", "measurement", "Chapter 9: Geometry", "Scale Drawings", "7.G scale reasoning", "Public-sequence match for accelerated Chapter 9.", "Use scale factors and proportions in drawings.", scaleDrawingQuestion),
    skill("g7a-angles", "grade7acc", "9", "9.5", "geometry", "Chapter 9: Geometry", "Angle Relationships", "7.G angle problem solving", "Public-sequence match for accelerated Chapter 9.", "Solve multi-step angle relationships.", angleRelationshipQuestion),
    skill("g7a-coordinate-distance", "grade7acc", "9", "9.6", "coordinate-plane", "Chapter 9: Geometry", "Coordinate Distance", "7.G coordinate plane reasoning", "Public-sequence match for accelerated Chapter 9.", "Use coordinate differences to find distance on the grid.", coordinateDistanceQuestion),
    skill("g7a-surface-area", "grade7acc", "10", "10.1", "measurement", "Chapter 10: Surface Area and Volume", "Surface Area of Prisms", "7.G surface area", "Public-sequence match for accelerated Chapter 10.", "Find the surface area of a rectangular prism.", surfaceAreaQuestion),
    skill("g7a-volume", "grade7acc", "10", "10.4", "measurement", "Chapter 10: Surface Area and Volume", "Volumes of Prisms", "7.G volume reasoning", "Public-sequence match for accelerated Chapter 10.", "Find the volume of a rectangular prism.", volumePrismQuestion),
    skill("g7a-translations", "grade7acc", "11", "11.1", "transformations", "Chapter 11: Transformations", "Translations", "8.G transformation reasoning", "Public-sequence match for accelerated Chapter 11.", "Track coordinate movement through a translation.", translationQuestion),
    skill("g7a-reflections", "grade7acc", "11", "11.2", "transformations", "Chapter 11: Transformations", "Reflections", "8.G transformation reasoning", "Public-sequence match for accelerated Chapter 11.", "Reflect a point across an axis and track the coordinate.", reflectionQuestion),
    skill("g7a-rotations", "grade7acc", "11", "11.3", "transformations", "Chapter 11: Transformations", "Rotations", "8.G transformation reasoning", "Public-sequence match for accelerated Chapter 11.", "Rotate points around the origin and track coordinates.", rotationQuestion),
    skill("g7a-square-roots", "grade7acc", "15", "15.1", "accelerated", "Chapter 15: Real Numbers", "Square Roots", "8.NS real-number work", "Public-sequence match for accelerated Chapter 15.", "Find perfect-square roots and connect them to area models.", squareRootQuestion),
    skill("g7a-linear-patterns", "grade7acc", "AT", "2.1", "functions", "Accelerated Topics: Functions", "Linear Patterns", "8.F pattern reasoning", "Public-sequence match for accelerated algebra preview topics.", "Identify the rule in a linear table and extend the pattern.", linearPatternQuestion),
    skill("g7a-slope", "grade7acc", "AT", "2.2", "functions", "Accelerated Topics: Functions", "Slope as Rate of Change", "8.EE slope and rate of change", "Public-sequence match for accelerated algebra preview topics.", "Compute slope from two points with integer coordinates.", slopeQuestion),
    skill("g8-transformations", "grade8", "1", "1.3", "transformations", "Chapter 1: Transformations", "Reflections and Rotations", "8.G transformation reasoning", "Original practice aligned to a public-style Grade 8 lesson flow.", "Track coordinates through reflections and rotations.", reflectionQuestion),
    skill("g8-slope", "grade8", "3", "3.1", "functions", "Chapter 3: Linear Relationships", "Slope as Rate of Change", "8.EE slope reasoning", "Original practice aligned to a public-style Grade 8 lesson flow.", "Compute slope from two points.", slopeQuestion),
    skill("g8-linear-pattern", "grade8", "3", "3.2", "functions", "Chapter 3: Linear Relationships", "Linear Patterns", "8.F pattern reasoning", "Original practice aligned to a public-style Grade 8 lesson flow.", "Use a linear rule to extend a pattern.", linearPatternQuestion),
    skill("g8-systems-preview", "grade8", "4", "4.4", "equations", "Chapter 4: Equations", "Multi-Step Equations", "8.EE equation solving", "Original practice aligned to a public-style Grade 8 lesson flow.", "Solve a multi-step equation with distribution.", multiStepEquationQuestion),
    skill("g8-square-roots", "grade8", "7", "7.1", "accelerated", "Chapter 7: Real Numbers", "Square Roots", "8.NS real-number work", "Original practice aligned to a public-style Grade 8 lesson flow.", "Find perfect-square roots.", squareRootQuestion),
    skill("g8-scientific-notation", "grade8", "7", "7.4", "accelerated", "Chapter 7: Real Numbers", "Scientific Notation", "8.EE scientific notation", "Original practice aligned to a public-style Grade 8 lesson flow.", "Convert values into or out of scientific notation.", scientificNotationQuestion),
    skill("g7-composite-area", "grade7", "10", "10.3", "measurement", "Chapter 10: Surface Area and Volume", "Composite Area", "7.G composite figure reasoning", "Original practice aligned to a public-style Grade 7 extension lesson.", "Break a figure into rectangles and combine areas.", compositeAreaQuestion),
    skill("g7-scatter-plots", "grade7", "8", "8.6", "data", "Chapter 8: Statistics", "Scatter Plot Trends", "7.SP informal data inference", "Original practice aligned to a public-style Grade 7 extension lesson.", "Read a trend statement from a scatter plot description.", scatterPlotQuestion),
    skill("g7a-multi-ineq", "grade7acc", "6", "6.9", "inequality-graphs", "Chapter 6: Equations and Inequalities", "Multi-Step Inequalities", "7.EE multi-step inequality reasoning", "Public-sequence extension for accelerated problem solving.", "Solve multi-step inequalities and identify the least integer solution.", multiStepInequalityQuestion),
    skill("g7a-function-table", "grade7acc", "AT", "2.3", "functions", "Accelerated Topics: Functions", "Function Tables", "8.F function table reasoning", "Public-sequence extension for accelerated algebra preview topics.", "Use an input-output rule to complete a function table.", functionTableQuestion),
    skill("g8-translation-image", "grade8", "1", "1.5", "transformations", "Chapter 1: Transformations", "Translated Points", "8.G coordinate transformations", "Original practice aligned to a public-style Grade 8 lesson flow.", "Give the image of a point after a translation.", translatedPointQuestion),
    skill("g8-pythagorean-preview", "grade8", "8", "8.2", "geometry", "Chapter 8: Geometry Extensions", "Pythagorean Preview", "8.G distance and right triangle reasoning", "Original practice aligned to a public-style Grade 8 extension lesson.", "Use square lengths to find a missing side in a right triangle.", pythagoreanPreviewQuestion)
  ];

  const el = {
    gradeFilters: document.getElementById("gradeFilters"),
    strandFilters: document.getElementById("strandFilters"),
    modeFilters: document.getElementById("modeFilters"),
    pathwayTitle: document.querySelector(".pathway-title"),
    pathwayDescription: document.querySelector(".panel--pathway .tiny"),
    pathwayBadges: document.querySelector(".pathway-badges"),
    skillName: document.getElementById("skillName"),
    skillMeta: document.getElementById("skillMeta"),
    lessonCode: document.getElementById("lessonCode"),
    skillDescription: document.getElementById("skillDescription"),
    standardText: document.getElementById("standardText"),
    alignmentText: document.getElementById("alignmentText"),
    promptText: document.getElementById("promptText"),
    answerForm: document.getElementById("answerForm"),
    answerInput: document.getElementById("answerInput"),
    submitButton: document.getElementById("submitButton"),
    startButton: document.getElementById("startButton"),
    skipButton: document.getElementById("skipButton"),
    feedbackText: document.getElementById("feedbackText"),
    streakValue: document.getElementById("streakValue"),
    scoreValue: document.getElementById("scoreValue"),
    accuracyValue: document.getElementById("accuracyValue"),
    levelValue: document.getElementById("levelValue"),
    medalCard: document.getElementById("medalCard"),
    medalTier: document.getElementById("medalTier"),
    medalText: document.getElementById("medalText"),
    xpFill: document.getElementById("xpFill"),
    xpText: document.getElementById("xpText"),
    questText: document.getElementById("questText"),
    skillList: document.getElementById("skillList"),
    roadmapList: document.getElementById("roadmapList")
    ,
    dashboardLessons: document.getElementById("dashboardLessons"),
    dashboardLessonsText: document.getElementById("dashboardLessonsText"),
    dashboardMastered: document.getElementById("dashboardMastered"),
    dashboardMasteredText: document.getElementById("dashboardMasteredText"),
    dashboardChallenge: document.getElementById("dashboardChallenge"),
    dashboardChallengeText: document.getElementById("dashboardChallengeText"),
    dashboardAccuracy: document.getElementById("dashboardAccuracy"),
    dashboardAccuracyText: document.getElementById("dashboardAccuracyText"),
    dashboardStrongest: document.getElementById("dashboardStrongest"),
    dashboardWeakest: document.getElementById("dashboardWeakest"),
    dashboardLeaderboardText: document.getElementById("dashboardLeaderboardText"),
    continueButton: document.getElementById("continueButton"),
    reviewButton: document.getElementById("reviewButton"),
    diagnosticButton: document.getElementById("diagnosticButton"),
    profileName: document.getElementById("profileName"),
    profileColor: document.getElementById("profileColor"),
    leaderboardOptIn: document.getElementById("leaderboardOptIn"),
    soundToggle: document.getElementById("soundToggle"),
    profileStatus: document.getElementById("profileStatus"),
    accountSelect: document.getElementById("accountSelect"),
    newAccountButton: document.getElementById("newAccountButton"),
    deleteAccountButton: document.getElementById("deleteAccountButton"),
    homeGreeting: document.getElementById("homeGreeting"),
    homeSummary: document.getElementById("homeSummary"),
    dailyGoalList: document.getElementById("dailyGoalList"),
    dailyGoalStatus: document.getElementById("dailyGoalStatus"),
    skillSearch: document.getElementById("skillSearch"),
    printReportButton: document.getElementById("printReportButton"),
    contrastToggleButton: document.getElementById("contrastToggleButton"),
    curriculumImport: document.getElementById("curriculumImport"),
    curriculumStatus: document.getElementById("curriculumStatus"),
    choiceList: document.getElementById("choiceList"),
    hintButton: document.getElementById("hintButton"),
    masteryTestButton: document.getElementById("masteryTestButton"),
    chapterTestButton: document.getElementById("chapterTestButton"),
    hintText: document.getElementById("hintText"),
    explanationText: document.getElementById("explanationText"),
    sessionText: document.getElementById("sessionText"),
    challengeBoardText: document.getElementById("challengeBoardText"),
    teachCard: document.getElementById("teachCard"),
    teachTitle: document.getElementById("teachTitle"),
    teachSummary: document.getElementById("teachSummary"),
    teachExample: document.getElementById("teachExample"),
    graphVisual: document.getElementById("graphVisual"),
    reflectionInput: document.getElementById("reflectionInput"),
    saveReflectionButton: document.getElementById("saveReflectionButton"),
    reflectionStatus: document.getElementById("reflectionStatus"),
    badgeList: document.getElementById("badgeList"),
    leaderboardList: document.getElementById("leaderboardList"),
    leaderboardStatus: document.getElementById("leaderboardStatus"),
    weeklyChallengeList: document.getElementById("weeklyChallengeList"),
    mistakeTrackerList: document.getElementById("mistakeTrackerList"),
    reviewNotebookList: document.getElementById("reviewNotebookList"),
    parentMinutes: document.getElementById("parentMinutes"),
    parentMinutesText: document.getElementById("parentMinutesText"),
    parentSessions: document.getElementById("parentSessions"),
    parentSessionsText: document.getElementById("parentSessionsText"),
    parentReadiness: document.getElementById("parentReadiness"),
    parentReadinessText: document.getElementById("parentReadinessText"),
    parentNextMove: document.getElementById("parentNextMove"),
    parentNextMoveText: document.getElementById("parentNextMoveText"),
    assignmentTitle: document.getElementById("assignmentTitle"),
    assignSkillButton: document.getElementById("assignSkillButton"),
    assignmentList: document.getElementById("assignmentList"),
    streakCalendar: document.getElementById("streakCalendar"),
    refreshLeaderboardButton: document.getElementById("refreshLeaderboardButton"),
    publishLeaderboardButton: document.getElementById("publishLeaderboardButton"),
    leaderboardImport: document.getElementById("leaderboardImport"),
    exportLeaderboardButton: document.getElementById("exportLeaderboardButton"),
    syncStatus: document.getElementById("syncStatus"),
    leaderboardSetupHint: document.getElementById("leaderboardSetupHint")
  };

  if (!el.answerForm) return;
  const inputState = { keys: Object.create(null), previous: Object.create(null) };
  window.addEventListener("keydown", (event) => {
    inputState.keys[event.key.toLowerCase()] = true;
    if (event.key === "Escape") event.preventDefault();
  });
  window.addEventListener("keyup", (event) => {
    inputState.keys[event.key.toLowerCase()] = false;
  });

  let accountsMeta = loadAccountsMeta();
  let state = createState();
  setupSectionToggles();
  refreshSelectedSkill();
  render();
  fetchOnlineLeaderboard();
  el.startButton.addEventListener("click", () => startSession(false));
  el.skipButton.addEventListener("click", skipQuestion);
  el.answerForm.addEventListener("submit", submitAnswer);
  el.continueButton.addEventListener("click", () => startSession(false));
  el.reviewButton.addEventListener("click", startSessionInReviewMode);
  el.diagnosticButton.addEventListener("click", startPlacementCheck);
  el.hintButton.addEventListener("click", showHint);
  el.masteryTestButton.addEventListener("click", startMasteryTest);
  el.profileName.addEventListener("input", updateProfileFromInputs);
  el.profileColor.addEventListener("input", updateProfileFromInputs);
  el.leaderboardOptIn.addEventListener("change", updateProfileFromInputs);
  el.soundToggle.addEventListener("change", updateProfileFromInputs);
  el.accountSelect.addEventListener("change", switchAccount);
  el.newAccountButton.addEventListener("click", createAccount);
  el.deleteAccountButton.addEventListener("click", deleteCurrentAccount);
  el.skillSearch.addEventListener("input", updateSearch);
  el.printReportButton.addEventListener("click", printReport);
  el.contrastToggleButton.addEventListener("click", toggleContrast);
  el.curriculumImport.addEventListener("change", importCurriculum);
  window.addEventListener("beforeunload", saveProgress);
  el.chapterTestButton.addEventListener("click", startChapterTest);
  el.saveReflectionButton.addEventListener("click", saveReflection);
  el.assignSkillButton.addEventListener("click", assignCurrentSkill);
  el.refreshLeaderboardButton.addEventListener("click", () => {
    fetchOnlineLeaderboard(true);
  });
  el.publishLeaderboardButton.addEventListener("click", publishOnlineScore);
  el.leaderboardImport.addEventListener("change", importLeaderboardJson);
  el.exportLeaderboardButton.addEventListener("click", exportLeaderboardJson);
  el.feedbackText.setAttribute("aria-live", "polite");
  el.explanationText.setAttribute("aria-live", "polite");
  el.hintText.setAttribute("aria-live", "polite");
  window.addEventListener("keydown", handleGlobalShortcuts);

  function createState() {
    const saved = loadProgress();
    const daily = normalizeDailyProgress(saved?.dailyProgress);
    return {
      accountId: accountsMeta.currentAccountId,
      activeRound: false,
      sessionType: "practice",
      reviewMode: false,
      streak: 0,
      score: 0,
      xp: saved?.xp || 0,
      level: saved?.level || 1,
      questProgress: 0,
      questGoal: 5,
      questionsAnswered: 0,
      correctAnswers: 0,
      totalLessonFocuses: saved?.totalLessonFocuses || 0,
      challengeClears: saved?.challengeClears || 0,
      bestAccuracy: saved?.bestAccuracy || 0,
      selectedGrade: saved?.selectedGrade || "grade7acc",
      selectedStrand: saved?.selectedStrand || "all",
      selectedMode: saved?.selectedMode || "onlevel",
      selectedSkillId: saved?.selectedSkillId || "g7a-int-add",
      skillMastery: saved?.skillMastery || createEmptyMastery(),
      currentQuestion: null,
      selectedChoiceIndex: null,
      totalProblemsSolved: saved?.totalProblemsSolved || 0,
      sessionsCompleted: saved?.sessionsCompleted || 0,
      totalPracticeSeconds: saved?.totalPracticeSeconds || 0,
      sessionStartedAt: null,
      placementResult: saved?.placementResult || null,
      masteryTests: saved?.masteryTests || {},
      dailyProgress: daily,
      searchQuery: saved?.searchQuery || "",
      highContrast: Boolean(saved?.highContrast),
      weeklyChallengeProgress: saved?.weeklyChallengeProgress || {},
      reviewNotebook: saved?.reviewNotebook || [],
      reflections: saved?.reflections || [],
      mistakeStats: saved?.mistakeStats || {},
      assignments: saved?.assignments || [],
      streakHistory: saved?.streakHistory || [],
      importedLeaderboard: saved?.importedLeaderboard || [],
      onlineLeaderboard: [],
      curriculumMap: saved?.curriculumMap || null,
      activeChapterTest: null,
      onlineSyncStatus: "Connecting to the online leaderboard...",
      tableReady: null,
      collapsedSections: saved?.collapsedSections || {},
      profile: {
        name: saved?.profile?.name || "Math Master",
        color: saved?.profile?.color || "#7de3ff",
        leaderboardOptIn: Boolean(saved?.profile?.leaderboardOptIn),
        soundOn: saved?.profile?.soundOn !== false
      },
      reflectionStatus: saved?.reflectionStatus || "Reflections are saved to the review notebook for this student.",
      visibleExplanation: saved?.visibleExplanation || "Step-by-step explanations appear after misses and mastery checks.",
      visibleHint: saved?.visibleHint || "Hints will appear here when you need a nudge.",
      activePlacement: null,
      activeMasteryTest: null
    };
  }

  function createEmptyMastery() {
    const mastery = {};
    for (const lesson of SKILLS) mastery[lesson.id] = 0;
    return mastery;
  }

  function createDefaultAccountsMeta() {
    return {
      currentAccountId: "student-1",
      accounts: [
        { id: "student-1", label: "Student 1" }
      ]
    };
  }

  function loadAccountsMeta() {
    try {
      const raw = window.localStorage.getItem(ACCOUNTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.accounts?.length && parsed.currentAccountId) return parsed;
      }
    } catch {
      // Ignore and fall back.
    }
    return createDefaultAccountsMeta();
  }

  function saveAccountsMeta() {
    try {
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accountsMeta));
    } catch {
      // Ignore storage failures.
    }
  }

  function getAccountStorageKey(accountId) {
    return STORAGE_KEY + ":" + accountId;
  }

  function normalizeDailyProgress(saved) {
    const today = getTodayStamp();
    if (!saved || saved.date !== today) {
      return { date: today, xp: 0, lessons: 0, challengeClears: 0 };
    }
    return {
      date: today,
      xp: saved.xp || 0,
      lessons: saved.lessons || 0,
      challengeClears: saved.challengeClears || 0
    };
  }

  function updateProfileFromInputs() {
    state.profile.name = (el.profileName.value || "Math Master").trim() || "Math Master";
    state.profile.color = el.profileColor.value || "#7de3ff";
    state.profile.leaderboardOptIn = el.leaderboardOptIn.checked;
    state.profile.soundOn = el.soundToggle.checked;
    state.visibleHint = "Hints will appear here when you need a nudge.";
    saveProgress();
    render();
  }

  function setupSectionToggles() {
    const sections = Array.from(document.querySelectorAll([
      ".math-masters > .panel",
      ".math-layout > .panel",
      ".math-bottom > .panel",
      ".community-grid > .community-panel",
      ".dashboard-lists > .dashboard-panel"
    ].join(", ")));
    sections.forEach((section, index) => {
      if (section.dataset.toggleReady === "true") return;
      section.dataset.toggleReady = "true";
      const sectionId = section.id || section.dataset.sectionId || "section-" + index;
      section.dataset.sectionId = sectionId;
      const header = document.createElement("div");
      header.className = "section-toggle__header";
      const titleEl = document.createElement("span");
      titleEl.className = "section-toggle__title";
      titleEl.textContent = getSectionToggleTitle(section);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "section-toggle__button";
      header.append(titleEl, button);

      const content = document.createElement("div");
      content.className = "section-toggle__content";
      while (section.firstChild) content.appendChild(section.firstChild);
      section.append(header, content);
      section.classList.add("section-toggle");

      button.addEventListener("click", () => {
        const nextCollapsed = !section.classList.contains("is-collapsed");
        state.collapsedSections[sectionId] = nextCollapsed;
        applySectionToggleState(section, nextCollapsed);
        saveProgress();
      });

      applySectionToggleState(section, Boolean(state.collapsedSections[sectionId]));
    });
  }

  function getSectionToggleTitle(section) {
    const label = section.querySelector(".panel__label");
    const title = section.getAttribute("aria-label")
      || (label ? label.textContent : "")
      || (section.querySelector("h2") ? section.querySelector("h2").textContent : "")
      || "Section";
    return String(title).replace(/\s+/g, " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function applySectionToggleState(section, collapsed) {
    const button = section.querySelector(".section-toggle__button");
    const content = section.querySelector(".section-toggle__content");
    section.classList.toggle("is-collapsed", collapsed);
    if (content) content.hidden = collapsed;
    if (button) {
      button.textContent = collapsed ? "Show More" : "Hide";
      button.setAttribute("aria-expanded", collapsed ? "false" : "true");
    }
  }

  function syncSectionToggles() {
    document.querySelectorAll(".section-toggle").forEach((section) => {
      applySectionToggleState(section, Boolean(state.collapsedSections[section.dataset.sectionId]));
    });
  }

  function updateSearch() {
    state.searchQuery = el.skillSearch.value.trim();
    refreshSelectedSkill();
    saveProgress();
    render();
  }

  function handleGlobalShortcuts(event) {
    if (event.key === "/" && document.activeElement !== el.answerInput && document.activeElement !== el.reflectionInput) {
      event.preventDefault();
      el.skillSearch.focus();
    }
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (!state.activeRound || !state.currentQuestion) return;
    const parsed = parseCurrentAnswer();
    if (!parsed.valid) {
      setFeedback(parsed.message, false);
      return;
    }
    const isCorrect = isAnswerCorrect(parsed.value, state.currentQuestion.answer, state.currentQuestion.answerType);
    state.questionsAnswered += 1;
    state.totalProblemsSolved += 1;
    let completedChallenge = false;
    if (isCorrect) {
      state.correctAnswers += 1;
      state.streak += 1;
      state.questProgress += 1;
      state.score += 35 + state.streak * 6;
      awardXp(18);
      adjustMastery(state.selectedSkillId, 9);
      state.visibleExplanation = "Nice work. " + buildCorrectExplanation(state.currentQuestion);
      if (state.sessionType === "mastery" && state.activeMasteryTest) state.activeMasteryTest.correct += 1;
      if (state.sessionType === "placement" && state.activePlacement) state.activePlacement.score += state.currentQuestion.difficultyWeight || 1;
      setFeedback("Correct. Keep stacking clean reps.", true);
      playCue("correct");
    } else {
      state.streak = 0;
      state.questProgress = 0;
      adjustMastery(state.selectedSkillId, -4);
      state.visibleExplanation = state.currentQuestion.explanation || ("Correct answer: " + formatAnswer(state.currentQuestion.answer) + ".");
      logMistake(state.selectedSkillId, state.currentQuestion, parsed.value);
      setFeedback("Not quite. Correct answer: " + formatAnswer(state.currentQuestion.answer) + ".", false);
      playCue("miss");
    }
    if (state.questProgress >= state.questGoal) {
      state.score += 140;
      awardXp(28);
      state.questProgress = 0;
      state.questGoal = 4 + Math.floor(Math.random() * 4);
      if (state.selectedMode === "challenge") {
        state.challengeClears += 1;
        state.dailyProgress.challengeClears += 1;
        completedChallenge = true;
      }
      setFeedback("Quest complete. Your pathway just leveled up.", true);
      playCue("celebrate");
    }
    state.bestAccuracy = Math.max(state.bestAccuracy, Math.round((state.correctAnswers / state.questionsAnswered) * 100));
    if (state.sessionType === "placement") {
      advancePlacement();
    } else if (state.sessionType === "mastery") {
      advanceMasteryTest();
    } else if (state.sessionType === "chapter-test") {
      if (isCorrect && state.activeChapterTest) state.activeChapterTest.correct += 1;
      advanceChapterTest();
    } else {
      nextQuestion();
    }
    if (completedChallenge) state.dailyProgress.challengeClears = Math.max(state.dailyProgress.challengeClears, 1);
    saveProgress();
    render();
  }

  function startSession(reviewMode) {
    syncPracticeTime();
    recordPracticeDay();
    state.activeRound = true;
    state.sessionType = reviewMode ? "review" : "practice";
    state.reviewMode = Boolean(reviewMode);
    state.activePlacement = null;
    state.activeMasteryTest = null;
    state.streak = 0;
    state.score = 0;
    state.questionsAnswered = 0;
    state.correctAnswers = 0;
    state.questProgress = 0;
    state.questGoal = 5;
    state.visibleHint = "Hints will appear here when you need a nudge.";
    state.visibleExplanation = "Step-by-step explanations appear after misses and mastery checks.";
    state.sessionStartedAt = Date.now();
    refreshSelectedSkill();
    nextQuestion();
    state.totalLessonFocuses += 1;
    state.dailyProgress.lessons += 1;
    setFeedback(reviewMode ? "Review mode started. We'll pull in older weak skills too." : "Session started. Stay sharp and steady.", true);
    render();
    el.answerInput.focus();
  }

  function startSessionInReviewMode() {
    startSession(true);
  }

  function startPlacementCheck() {
    syncPracticeTime();
    recordPracticeDay();
    state.activeRound = true;
    state.reviewMode = false;
    state.sessionType = "placement";
    state.streak = 0;
    state.score = 0;
    state.questionsAnswered = 0;
    state.correctAnswers = 0;
    state.questProgress = 0;
    state.sessionStartedAt = Date.now();
    state.activePlacement = { index: 0, score: 0 };
    state.activeMasteryTest = null;
    state.visibleHint = "Use the hint if a question feels too far ahead.";
    state.visibleExplanation = "Placement feedback will help choose the right path.";
    setFeedback("Placement check started. Answer five mixed questions as best you can.", true);
    nextQuestion();
    render();
  }

  function startMasteryTest() {
    syncPracticeTime();
    recordPracticeDay();
    const lesson = getSkillById(state.selectedSkillId);
    if (!lesson) return;
    state.activeRound = true;
    state.reviewMode = false;
    state.sessionType = "mastery";
    state.streak = 0;
    state.score = 0;
    state.questionsAnswered = 0;
    state.correctAnswers = 0;
    state.questProgress = 0;
    state.sessionStartedAt = Date.now();
    state.activePlacement = null;
    state.activeMasteryTest = { skillId: lesson.id, index: 0, total: 5, correct: 0 };
    state.visibleHint = "Hints stay available during mastery tests, but try first without them.";
    state.visibleExplanation = "Mastery tests use five checks on the current lesson.";
    setFeedback("Mastery test started for " + lesson.name + ".", true);
    nextQuestion();
    render();
  }

  function startChapterTest() {
    const lesson = getSkillById(state.selectedSkillId);
    if (!lesson) return;
    const chapterSkills = getSkillsForGrade().filter((item) => item.chapter === lesson.chapter);
    if (!chapterSkills.length) return;
    syncPracticeTime();
    recordPracticeDay();
    state.activeRound = true;
    state.reviewMode = false;
    state.sessionType = "chapter-test";
    state.streak = 0;
    state.score = 0;
    state.questionsAnswered = 0;
    state.correctAnswers = 0;
    state.questProgress = 0;
    state.sessionStartedAt = Date.now();
    state.activePlacement = null;
    state.activeMasteryTest = null;
    state.activeChapterTest = {
      chapter: lesson.chapter,
      skillIds: chapterSkills.map((item) => item.id),
      index: 0,
      total: Math.min(6, Math.max(4, chapterSkills.length)),
      correct: 0
    };
    state.visibleHint = "Chapter tests mix related skills from the current chapter.";
    state.visibleExplanation = "Chapter tests check whether you can apply a whole cluster of chapter skills.";
    setFeedback("Chapter test started for Chapter " + lesson.chapter + ".", true);
    nextQuestion();
    render();
  }

  function refreshQuestionForCurrentSelection() {
    refreshSelectedSkill();
    if (state.activeRound) {
      nextQuestion();
      el.answerInput.focus();
    } else {
      state.currentQuestion = null;
    }
  }

  function skipQuestion() {
    if (!state.activeRound) return;
    state.streak = 0;
    state.questProgress = 0;
    state.score = Math.max(0, state.score - 10);
    adjustMastery(state.selectedSkillId, -2);
    state.visibleExplanation = state.currentQuestion?.explanation || "Skips reset the streak. Review the pattern and try the next one.";
    setFeedback("Skipped. Reset and take the next rep.", false);
    if (state.sessionType === "placement") {
      advancePlacement();
    } else if (state.sessionType === "mastery") {
      advanceMasteryTest();
    } else if (state.sessionType === "chapter-test") {
      advanceChapterTest();
    } else {
      nextQuestion();
    }
    saveProgress();
    render();
  }

  function refreshSelectedSkill() {
    const visible = getVisibleSkills();
    if (!visible.length) return;
    if (!visible.some((lesson) => lesson.id === state.selectedSkillId)) {
      state.selectedSkillId = visible[0].id;
    }
  }

  function nextQuestion() {
    const lesson = getSkillById(state.selectedSkillId) || chooseSkill();
    if (!lesson) return;
    state.selectedSkillId = lesson.id;
    if (state.sessionType === "placement") {
      state.currentQuestion = decorateQuestion(getPlacementQuestion(), lesson);
    } else {
      state.currentQuestion = decorateQuestion(lesson.generate(), lesson);
    }
    state.selectedChoiceIndex = null;
    el.answerInput.value = "";
  }

  function chooseSkill() {
    const pool = getVisibleSkills();
    const ranked = [...pool].sort((a, b) => getMastery(a.id) - getMastery(b.id));
    if (state.reviewMode) {
      const reviewPool = ranked.filter((lesson) => getMastery(lesson.id) < 70);
      if (reviewPool.length) return reviewPool[randomInt(0, reviewPool.length - 1)];
    }
    if (state.sessionType === "mastery" && state.activeMasteryTest) {
      return getSkillById(state.activeMasteryTest.skillId) || ranked[0];
    }
    if (state.sessionType === "chapter-test" && state.activeChapterTest) {
      const chapterPool = state.activeChapterTest.skillIds.map((skillId) => getSkillById(skillId)).filter(Boolean);
      return chapterPool[randomInt(0, chapterPool.length - 1)] || ranked[0];
    }
    return Math.random() < 0.72 ? ranked[0] : ranked[randomInt(0, ranked.length - 1)];
  }

  function getPlacementQuestion() {
    const questions = [
      decorateStandaloneQuestion(integerAddQuestion(), "numbers", 1),
      decorateStandaloneQuestion(percentChangeQuestion(), "finance", 2),
      decorateStandaloneQuestion(twoStepEquationQuestion(), "equations", 2),
      decorateStandaloneQuestion(compositeAreaQuestion(), "measurement", 3),
      decorateStandaloneQuestion(functionTableQuestion(), "functions", 3)
    ];
    return questions[Math.min(state.activePlacement?.index || 0, questions.length - 1)];
  }

  function advancePlacement() {
    state.activePlacement.index += 1;
    if (state.activePlacement.index >= 5) {
      finishPlacement();
      return;
    }
    nextQuestion();
  }

  function finishPlacement() {
    syncPracticeTime();
    const score = state.activePlacement?.score || 0;
    let grade = "grade6";
    if (score >= 11) grade = "grade8";
    else if (score >= 8) grade = "grade7acc";
    else if (score >= 5) grade = "grade7";
    state.selectedGrade = grade;
    state.selectedStrand = "all";
    state.selectedMode = score >= 10 ? "challenge" : score >= 6 ? "onlevel" : "warmup";
    state.placementResult = { date: getTodayStamp(), score, grade, mode: state.selectedMode };
    state.activePlacement = null;
    state.activeRound = false;
    state.sessionStartedAt = null;
    state.sessionType = "practice";
    refreshSelectedSkill();
    state.currentQuestion = null;
    state.visibleExplanation = "Placement check complete. Recommended path: " + getGradePath().label + " in " + modeLabel(state.selectedMode) + ".";
    setFeedback("Placement complete. Recommended path updated.", true);
    saveProgress();
  }

  function advanceMasteryTest() {
    state.activeMasteryTest.index += 1;
    if (state.activeMasteryTest.index >= state.activeMasteryTest.total) {
      finishMasteryTest();
      return;
    }
    nextQuestion();
  }

  function finishMasteryTest() {
    syncPracticeTime();
    const test = state.activeMasteryTest;
    const skillId = test.skillId;
    const passed = test.correct >= 4;
    const record = state.masteryTests[skillId] || { attempts: 0, best: 0, passed: false };
    record.attempts += 1;
    record.best = Math.max(record.best, test.correct);
    record.passed = record.passed || passed;
    state.masteryTests[skillId] = record;
    if (passed) {
      state.skillMastery[skillId] = Math.max(getMastery(skillId), 85);
      awardXp(35);
      setFeedback("Mastery test passed. Skill marked mastered.", true);
      playCue("celebrate");
    } else {
      setFeedback("Mastery test finished. Review the explanation and try again.", false);
    }
    state.visibleExplanation = passed
      ? "You answered " + test.correct + " out of " + test.total + " correctly, so this lesson now counts as mastered."
      : "You answered " + test.correct + " out of " + test.total + " correctly. Build a few more clean reps, then test again.";
    state.activeMasteryTest = null;
    state.activeRound = false;
    state.sessionStartedAt = null;
    state.sessionType = "practice";
    state.currentQuestion = null;
    saveProgress();
  }

  function advanceChapterTest() {
    state.activeChapterTest.index += 1;
    if (state.activeChapterTest.index >= state.activeChapterTest.total) {
      finishChapterTest();
      return;
    }
    nextQuestion();
  }

  function finishChapterTest() {
    syncPracticeTime();
    const test = state.activeChapterTest;
    const passed = test.correct >= Math.ceil(test.total * 0.7);
    state.visibleExplanation = "You answered " + test.correct + " out of " + test.total + " chapter test questions correctly.";
    if (passed) {
      awardXp(40);
      setFeedback("Chapter test complete. Nice chapter-level work.", true);
      playCue("celebrate");
    } else {
      setFeedback("Chapter test complete. Review the weak skills from this chapter.", false);
    }
    state.activeChapterTest = null;
    state.activeRound = false;
    state.sessionStartedAt = null;
    state.sessionType = "practice";
    state.currentQuestion = null;
    saveProgress();
  }

  function decorateStandaloneQuestion(question, strand, difficultyWeight) {
    const lesson = { strand, unit: "Placement Check", standard: "Mixed readiness", alignment: "Adaptive placement sample" };
    const decorated = decorateQuestion(question, lesson);
    decorated.difficultyWeight = difficultyWeight;
    return decorated;
  }

  function decorateQuestion(question, lesson) {
    const prompt = question.prompt;
    return {
      prompt,
      answer: question.answer,
      answerType: question.answerType || "number",
      choices: question.choices || null,
      difficultyWeight: question.difficultyWeight || 1,
      hint: question.hint || buildHint(prompt, lesson),
      explanation: question.explanation || buildExplanation(question, lesson)
    };
  }

  function getGradePath() {
    return GRADE_PATHS.find((path) => path.id === state.selectedGrade) || GRADE_PATHS[0];
  }

  function getVisibleSkills() {
    const query = normalizeSearchText(state.searchQuery);
    return SKILLS.filter((lesson) => {
      if (lesson.grade !== state.selectedGrade) return false;
      if (state.selectedStrand !== "all" && lesson.strand !== state.selectedStrand) return false;
      if (query) {
        const haystack = normalizeSearchText(lesson.name + " " + lesson.description + " " + lesson.unit + " " + lesson.standard);
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }

  function getSkillsForGrade() {
    return SKILLS.filter((lesson) => lesson.grade === state.selectedGrade);
  }

  function getSkillById(skillId) {
    return SKILLS.find((lesson) => lesson.id === skillId) || null;
  }

  function getMastery(skillId) {
    return state.skillMastery[skillId] || 0;
  }

  function isSkillLocked(skillId) {
    const prereqs = PREREQUISITES[skillId] || [];
    return prereqs.some((prereqId) => getMastery(prereqId) < 55);
  }

  function adjustMastery(skillId, delta) {
    state.skillMastery[skillId] = clamp(getMastery(skillId) + delta, 0, 100);
  }

  function awardXp(amount) {
    state.xp += amount;
    state.dailyProgress.xp += amount;
    while (state.xp >= 100) {
      state.xp -= 100;
      state.level += 1;
    }
  }

  function render() {
    syncSectionToggles();
    syncDailyProgress();
    const lesson = getSkillById(state.selectedSkillId) || getVisibleSkills()[0];
    const accuracy = state.questionsAnswered === 0 ? 100 : Math.round((state.correctAnswers / state.questionsAnswered) * 100);
    const path = getGradePath();
    hydrateProfileInputs();
    renderAccounts();
    el.pathwayTitle.textContent = path.title;
    el.pathwayDescription.textContent = path.description;
    el.homeGreeting.textContent = "Welcome back, " + state.profile.name;
    el.homeGreeting.style.color = state.profile.color;
    el.homeSummary.textContent = state.placementResult
      ? "Placement recommends " + path.label + " in " + modeLabel(state.selectedMode) + ". Continue, review weak skills, or retake placement."
      : "Pick up where you left off, take a placement check, or jump into review mode.";
    renderPathwayBadges();
    renderGradeFilters();
    renderStrands();
    renderModes();
    renderSkillList();
    renderRoadmap();
    renderDashboard();
    renderDailyGoals();
    renderBadges();
    renderLeaderboard();
    renderWeeklyChallenges();
    renderMistakeTracker();
    renderReviewNotebook();
    renderAssignments();
    renderStreakCalendar();
    renderParentView();
    if (lesson) {
      el.skillName.textContent = lesson.name;
      el.skillMeta.textContent = lesson.unit + " | " + strandLabel(lesson.strand);
      el.lessonCode.textContent = "Chapter " + lesson.chapter + " | Lesson " + lesson.lesson;
      el.skillDescription.textContent = lesson.description;
      el.standardText.textContent = lesson.standard;
      el.alignmentText.textContent = lesson.alignment;
      renderTeachCard(lesson);
    }
    el.promptText.textContent = state.currentQuestion ? state.currentQuestion.prompt : "Press Start to begin.";
    el.streakValue.textContent = String(state.streak);
    el.scoreValue.textContent = String(state.score);
    el.accuracyValue.textContent = accuracy + "%";
    el.levelValue.textContent = String(state.level);
    renderMedal();
    el.xpFill.style.width = state.xp + "%";
    el.xpText.textContent = state.xp + " / 100 mastery XP";
    el.questText.textContent = "Answer " + state.questGoal + " in a row correctly (" + state.questProgress + "/" + state.questGoal + ").";
    el.sessionText.textContent = sessionLabel();
    el.answerInput.disabled = !state.activeRound;
    el.submitButton.disabled = !state.activeRound;
    el.skipButton.disabled = !state.activeRound;
    el.hintButton.disabled = !state.activeRound;
    el.masteryTestButton.disabled = state.sessionType === "placement";
    el.chapterTestButton.disabled = state.sessionType === "placement";
    el.hintText.textContent = state.visibleHint;
    el.explanationText.textContent = state.visibleExplanation;
    el.challengeBoardText.textContent = "This week's challenge board updates using the current calendar week and your selected grade path.";
    el.curriculumStatus.textContent = state.curriculumMap
      ? "Curriculum import active: " + state.curriculumMap.label
      : "You can import a local pacing guide or assignment map in JSON format.";
    el.syncStatus.textContent = state.onlineSyncStatus || (state.importedLeaderboard.length
      ? "Imported shared leaderboard entries are included in the board."
      : "Backend-ready JSON import/export is enabled for future shared sync.");
    if (el.leaderboardSetupHint) {
      el.leaderboardSetupHint.textContent = state.tableReady === true
        ? "Online leaderboard is connected through Supabase. JSON import/export is still available as a backup."
        : state.tableReady === false
          ? "Run the included Supabase SQL once to create the online leaderboard table and policies."
          : "Checking whether the online leaderboard table is ready...";
    }
    el.reflectionStatus.textContent = state.reflectionStatus;
    renderAnswerControls();
    renderGraphVisual();
    document.body.classList.toggle("high-contrast", state.highContrast);
  }

  function renderPathwayBadges() {
    const skills = getSkillsForGrade();
    const strandSet = new Set(skills.map((lesson) => strandLabel(lesson.strand)));
    el.pathwayBadges.innerHTML = "";
    for (const strand of [...strandSet].slice(0, 6)) {
      const chip = document.createElement("span");
      chip.textContent = strand;
      el.pathwayBadges.appendChild(chip);
    }
  }

  function renderDashboard() {
    const visibleSkills = getSkillsForGrade();
    const masteredCount = visibleSkills.filter((lesson) => getMastery(lesson.id) >= 85).length;
    const strongest = rankStrands(false);
    const weakest = rankStrands(true);

    el.dashboardLessons.textContent = String(state.totalLessonFocuses);
    el.dashboardLessonsText.textContent = state.totalLessonFocuses > 0
      ? "You have started " + state.totalLessonFocuses + " focused practice sessions."
      : "Keep going to build your course history.";

    el.dashboardMastered.textContent = String(masteredCount);
    el.dashboardMasteredText.textContent = masteredCount > 0
      ? "Skills above 85% mastery count as mastered."
      : "Push skills past 85% mastery.";

    el.dashboardChallenge.textContent = String(state.challengeClears);
    el.dashboardChallengeText.textContent = state.challengeClears > 0
      ? "Challenge-mode quest clears are stacking up."
      : "Challenge mode wins count here.";

    el.dashboardAccuracy.textContent = state.bestAccuracy + "%";
    el.dashboardAccuracyText.textContent = state.bestAccuracy > 0
      ? "Best recorded session accuracy so far."
      : "Finish a session to set this.";

    renderRankingList(el.dashboardStrongest, strongest, "No category data yet.");
    renderRankingList(el.dashboardWeakest, weakest, "No category data yet.");

    el.dashboardLeaderboardText.textContent =
      state.tableReady
        ? "Supabase is connected. Use Publish My Score in the Leaderboard Backend Sync panel to add this student to the live board."
        : "The live leaderboard is wired, but Supabase still needs the leaderboard table setup.";
  }

  function renderAccounts() {
    el.accountSelect.innerHTML = "";
    for (const account of accountsMeta.accounts) {
      const option = document.createElement("option");
      option.value = account.id;
      option.textContent = account.label;
      if (account.id === state.accountId) option.selected = true;
      el.accountSelect.appendChild(option);
    }
    el.skillSearch.value = state.searchQuery;
    el.contrastToggleButton.textContent = state.highContrast ? "Standard Contrast" : "High Contrast";
  }

  function renderRankingList(target, rankings, emptyText) {
    target.innerHTML = "";
    if (!rankings.length) {
      const empty = document.createElement("p");
      empty.className = "tiny";
      empty.textContent = emptyText;
      target.appendChild(empty);
      return;
    }
    for (const item of rankings.slice(0, 3)) {
      const row = document.createElement("div");
      row.className = "dashboard-ranking";
      row.innerHTML = "<strong>" + item.label + "</strong><span>" + item.value + "%</span>";
      target.appendChild(row);
    }
  }

  function rankStrands(reverse) {
    const gradeSkills = getSkillsForGrade();
    const groups = [];
    for (const strand of STRANDS) {
      if (strand.id === "all") continue;
      const lessons = gradeSkills.filter((lesson) => lesson.strand === strand.id);
      if (!lessons.length) continue;
      const average = Math.round(lessons.reduce((sum, lesson) => sum + getMastery(lesson.id), 0) / lessons.length);
      groups.push({ label: strand.label, value: average });
    }
    return groups.sort((a, b) => reverse ? a.value - b.value : b.value - a.value);
  }

  function renderMedal() {
    const medal = getCurrentMedal();
    el.medalTier.textContent = medal.label;
    el.medalText.textContent = medal.next === "Maxed tier"
      ? "You reached the highest medal tier."
      : "Keep practicing to reach " + medal.next + ".";
    el.medalCard.className = "medal-card medal-card--" + medal.id;
  }

  function getCurrentMedal() {
    const masteryAverage = averageMastery();
    const totalScore = state.level * 100 + masteryAverage + state.score;
    let current = MEDALS[0];
    for (const medal of MEDALS) {
      if (totalScore >= medal.minScore) current = medal;
    }
    return current;
  }

  function averageMastery() {
    const values = Object.values(state.skillMastery);
    if (!values.length) return 0;
    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round(total / values.length);
  }

  function renderGradeFilters() {
    el.gradeFilters.innerHTML = "";
    for (const path of GRADE_PATHS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "grade-button" + (state.selectedGrade === path.id ? " is-active" : "");
      button.textContent = path.label;
      button.addEventListener("click", () => {
        state.selectedGrade = path.id;
        state.selectedStrand = "all";
        refreshQuestionForCurrentSelection();
        saveProgress();
        render();
      });
      el.gradeFilters.appendChild(button);
    }
  }

  function renderModes() {
    el.modeFilters.innerHTML = "";
    for (const mode of MODES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mode-button" + (state.selectedMode === mode.id ? " is-active" : "");
      button.textContent = mode.label;
      button.addEventListener("click", () => {
        state.selectedMode = mode.id;
        refreshQuestionForCurrentSelection();
        saveProgress();
        render();
      });
      el.modeFilters.appendChild(button);
    }
  }

  function renderStrands() {
    el.strandFilters.innerHTML = "";
    const gradeSkills = getSkillsForGrade();
    const availableStrands = new Set(gradeSkills.map((lesson) => lesson.strand));
    for (const strand of STRANDS) {
      if (strand.id !== "all" && !availableStrands.has(strand.id)) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "strand-button" + (state.selectedStrand === strand.id ? " is-active" : "");
      button.textContent = strand.label;
      button.addEventListener("click", () => {
        state.selectedStrand = strand.id;
        refreshQuestionForCurrentSelection();
        saveProgress();
        render();
      });
      el.strandFilters.appendChild(button);
    }
  }

  function renderSkillList() {
    el.skillList.innerHTML = "";
    const visibleSkills = getVisibleSkills();
    if (!visibleSkills.length) {
      const empty = document.createElement("p");
      empty.className = "tiny";
      empty.textContent = "No lessons match that search yet. Try a broader topic or switch strands.";
      el.skillList.appendChild(empty);
      return;
    }
    for (const lesson of visibleSkills) {
      const mastery = getMastery(lesson.id);
      const locked = isSkillLocked(lesson.id);
      const item = document.createElement("article");
      item.className = "skill-item" + (lesson.id === state.selectedSkillId ? " is-selected" : "") + (locked ? " is-locked" : "");
      item.innerHTML = [
        '<div class="skill-item__top">',
        "<div>",
        '<h3 class="skill-item__name">' + lesson.name + "</h3>",
        '<p class="skill-item__meta">' + lesson.unit + " | Lesson " + lesson.lesson + "</p>",
        "</div>",
        '<span class="skill-item__tag">' + mastery + "%</span>",
        "</div>",
        '<p class="skill-item__meta">' + lesson.description + "</p>",
        locked ? '<p class="skill-item__lock">Locked until prerequisite skills are stronger.</p>' : "",
        '<div class="xp-track"><div style="width:' + mastery + '%;height:100%;background:linear-gradient(90deg,#7de3ff,#52d273)"></div></div>',
        '<div class="skill-item__footer">',
        '<span class="skill-item__meta">Chapter ' + lesson.chapter + " | " + lesson.standard + "</span>",
        '<button type="button" class="skill-item__action"' + (locked ? " disabled" : "") + '>Focus</button>',
        "</div>"
      ].join("");
      if (!locked) {
        item.querySelector(".skill-item__action").addEventListener("click", () => {
          state.selectedSkillId = lesson.id;
          refreshQuestionForCurrentSelection();
          saveProgress();
          render();
        });
      }
      el.skillList.appendChild(item);
    }
  }

  function renderRoadmap() {
    const grouped = [];
    for (const lesson of getSkillsForGrade()) {
      let unit = grouped.find((entry) => entry.name === lesson.unit);
      if (!unit) {
        unit = { name: lesson.unit, chapter: lesson.chapter, count: 0, masteryTotal: 0 };
        grouped.push(unit);
      }
      unit.count += 1;
      unit.masteryTotal += getMastery(lesson.id);
    }
    el.roadmapList.innerHTML = "";
    for (const unit of grouped) {
      const progress = Math.round(unit.masteryTotal / unit.count);
      const item = document.createElement("article");
      item.className = "roadmap-item";
      item.innerHTML = [
        '<div class="roadmap-item__top">',
        '<h3 class="roadmap-item__title">' + unit.name + "</h3>",
        '<span class="roadmap-item__badge">' + unit.count + " lessons</span>",
        "</div>",
        '<p class="roadmap-item__meta">Chapter ' + unit.chapter + " | " + progress + "% complete</p>",
        '<div class="roadmap-progress"><div style="width:' + progress + '%"></div></div>'
      ].join("");
      el.roadmapList.appendChild(item);
    }
  }

  function strandLabel(strandId) {
    return STRANDS.find((strand) => strand.id === strandId)?.label || "Skill";
  }

  function setFeedback(message, positive) {
    el.feedbackText.textContent = message;
    el.feedbackText.style.color = positive ? "#7de3ff" : "#ff9f7d";
  }

  function loadProgress() {
    try {
      const raw = window.localStorage.getItem(getAccountStorageKey(accountsMeta.currentAccountId));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveProgress() {
    try {
      syncPracticeTime();
      window.localStorage.setItem(getAccountStorageKey(state.accountId), JSON.stringify({
        xp: state.xp,
        level: state.level,
        totalLessonFocuses: state.totalLessonFocuses,
        challengeClears: state.challengeClears,
        bestAccuracy: state.bestAccuracy,
        selectedGrade: state.selectedGrade,
        selectedStrand: state.selectedStrand,
        selectedMode: state.selectedMode,
        selectedSkillId: state.selectedSkillId,
        skillMastery: state.skillMastery,
        totalProblemsSolved: state.totalProblemsSolved,
        sessionsCompleted: state.sessionsCompleted,
        totalPracticeSeconds: state.totalPracticeSeconds,
        placementResult: state.placementResult,
        masteryTests: state.masteryTests,
        dailyProgress: state.dailyProgress,
        searchQuery: state.searchQuery,
        highContrast: state.highContrast,
        weeklyChallengeProgress: state.weeklyChallengeProgress,
        reviewNotebook: state.reviewNotebook,
        reflections: state.reflections,
        mistakeStats: state.mistakeStats,
        assignments: state.assignments,
        streakHistory: state.streakHistory,
        importedLeaderboard: state.importedLeaderboard,
        curriculumMap: state.curriculumMap,
        collapsedSections: state.collapsedSections,
        profile: state.profile,
        reflectionStatus: state.reflectionStatus,
        visibleExplanation: state.visibleExplanation,
        visibleHint: state.visibleHint
      }));
    } catch {
      // Ignore storage failures.
    }
  }

  function switchAccount() {
    saveProgress();
    accountsMeta.currentAccountId = el.accountSelect.value;
    saveAccountsMeta();
    state = createState();
    refreshSelectedSkill();
    render();
  }

  function createAccount() {
    const name = window.prompt("New student name:");
    if (!name) return;
    const id = "student-" + Date.now();
    accountsMeta.accounts.push({ id, label: name.trim() || "Student" });
    accountsMeta.currentAccountId = id;
    saveAccountsMeta();
    state = createState();
    state.profile.name = name.trim() || "Student";
    saveProgress();
    refreshSelectedSkill();
    render();
  }

  function deleteCurrentAccount() {
    if (accountsMeta.accounts.length <= 1) {
      el.profileStatus.textContent = "At least one student account must remain.";
      return;
    }
    const account = accountsMeta.accounts.find((item) => item.id === state.accountId);
    if (!window.confirm("Delete " + (account?.label || "this account") + " and its saved progress?")) return;
    window.localStorage.removeItem(getAccountStorageKey(state.accountId));
    accountsMeta.accounts = accountsMeta.accounts.filter((item) => item.id !== state.accountId);
    accountsMeta.currentAccountId = accountsMeta.accounts[0].id;
    saveAccountsMeta();
    state = createState();
    refreshSelectedSkill();
    render();
  }

  function printReport() {
    window.print();
  }

  function toggleContrast() {
    state.highContrast = !state.highContrast;
    saveProgress();
    render();
  }

  async function fetchOnlineLeaderboard(forceMessage) {
    state.onlineSyncStatus = forceMessage ? "Refreshing online leaderboard..." : "Connecting to the online leaderboard...";
    render();
    try {
      const response = await fetch(
        SUPABASE_URL + "/rest/v1/" + SUPABASE_TABLE + "?select=account_id,display_name,medal,xp,challenge_clears,mastery,grade_path,updated_at&order=xp.desc,mastery.desc,updated_at.asc&limit=10",
        {
          headers: getSupabaseHeaders()
        }
      );
      const payload = await response.json().catch(() => ([]));
      if (!response.ok) {
        handleSupabaseError(payload);
        return;
      }
      state.tableReady = true;
      state.onlineLeaderboard = Array.isArray(payload) ? payload.map(normalizeRemoteEntry) : [];
      state.onlineSyncStatus = state.onlineLeaderboard.length
        ? "Online leaderboard synced from Supabase."
        : "Online leaderboard is live but does not have entries yet.";
    } catch {
      state.onlineSyncStatus = "Could not reach Supabase right now. The local app still works.";
    }
    render();
  }

  async function publishOnlineScore() {
    if (!state.profile.leaderboardOptIn) {
      state.onlineSyncStatus = "Turn on the leaderboard option in the student profile before publishing.";
      render();
      return;
    }
    state.onlineSyncStatus = "Publishing this student's score to the online leaderboard...";
    render();
    try {
      const response = await fetch(
        SUPABASE_URL + "/rest/v1/" + SUPABASE_TABLE + "?on_conflict=account_id",
        {
          method: "POST",
          headers: {
            ...getSupabaseHeaders(),
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: JSON.stringify([buildOnlineScorePayload()])
        }
      );
      const payload = await response.json().catch(() => ([]));
      if (!response.ok) {
        handleSupabaseError(payload);
        return;
      }
      state.tableReady = true;
      state.onlineSyncStatus = "Score published to the online leaderboard.";
      await fetchOnlineLeaderboard(false);
    } catch {
      state.onlineSyncStatus = "Publishing failed. Check the network and Supabase table setup.";
      render();
    }
  }

  function getSupabaseHeaders() {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY
    };
  }

  function buildOnlineScorePayload() {
    return {
      account_id: state.accountId,
      display_name: state.profile.name.slice(0, 18) || "Math Master",
      medal: getCurrentMedal().label,
      xp: state.level * 100 + state.xp,
      challenge_clears: state.challengeClears,
      mastery: averageMastery(),
      grade_path: getGradePath().label,
      updated_at: new Date().toISOString()
    };
  }

  function normalizeRemoteEntry(entry) {
    return {
      name: entry.display_name || "Math Master",
      medal: entry.medal || "Bronze",
      xp: Number(entry.xp) || 0,
      challengeClears: Number(entry.challenge_clears) || 0,
      mastery: Number(entry.mastery) || 0,
      gradePath: entry.grade_path || "",
      accountId: entry.account_id || "",
      updatedAt: entry.updated_at || "",
      remote: true
    };
  }

  function handleSupabaseError(payload) {
    const code = payload && typeof payload === "object" ? payload.code : "";
    if (code === "PGRST205") {
      state.tableReady = false;
      state.onlineLeaderboard = [];
      state.onlineSyncStatus = "Supabase is connected, but the leaderboard table has not been created yet.";
    } else {
      state.onlineSyncStatus = "Supabase returned an error while loading the online leaderboard.";
    }
    render();
  }

  function importCurriculum(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        state.curriculumMap = {
          label: parsed.label || "Imported Curriculum",
          assignments: parsed.assignments || []
        };
        if (Array.isArray(parsed.assignments)) {
          state.assignments = parsed.assignments.map((item, index) => ({
            title: item.title || ("Imported Assignment " + (index + 1)),
            skillId: item.skillId || state.selectedSkillId,
            skillName: getSkillById(item.skillId || state.selectedSkillId)?.name || "Imported Skill"
          }));
        }
        saveProgress();
        render();
      } catch {
        el.curriculumStatus.textContent = "That file could not be read as curriculum JSON.";
      }
    };
    reader.readAsText(file);
  }

  function saveReflection() {
    const text = el.reflectionInput.value.trim();
    if (!text || !state.currentQuestion) {
      state.reflectionStatus = "Write a short reflection first.";
      render();
      return;
    }
    state.reflections.push({
      date: getTodayStamp(),
      skill: getSkillById(state.selectedSkillId)?.name || "Skill",
      reflection: text
    });
    state.reviewNotebook.push({
      date: getTodayStamp(),
      skill: getSkillById(state.selectedSkillId)?.name || "Skill",
      prompt: state.currentQuestion.prompt,
      answer: formatAnswer(state.currentQuestion.answer),
      reflection: text
    });
    el.reflectionInput.value = "";
    state.reflectionStatus = "Reflection saved to the notebook.";
    saveProgress();
    render();
  }

  function assignCurrentSkill() {
    const lesson = getSkillById(state.selectedSkillId);
    if (!lesson) return;
    state.assignments.push({
      title: el.assignmentTitle.value.trim() || "Practice Assignment",
      skillId: lesson.id,
      skillName: lesson.name,
      date: getTodayStamp()
    });
    el.assignmentTitle.value = "";
    saveProgress();
    render();
  }

  function importLeaderboardJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        state.importedLeaderboard = Array.isArray(parsed) ? parsed : [];
        saveProgress();
        render();
      } catch {
        el.syncStatus.textContent = "That leaderboard file could not be imported.";
      }
    };
    reader.readAsText(file);
  }

  function exportLeaderboardJson() {
    const payload = JSON.stringify(buildLeaderboardEntries(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "math-masters-leaderboard.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function hydrateProfileInputs() {
    if (el.profileName.value !== state.profile.name) el.profileName.value = state.profile.name;
    if (el.profileColor.value !== state.profile.color) el.profileColor.value = state.profile.color;
    el.leaderboardOptIn.checked = state.profile.leaderboardOptIn;
    el.soundToggle.checked = state.profile.soundOn;
    el.profileStatus.textContent = state.profile.leaderboardOptIn
      ? "Profile saves on this device and can be published to the live online leaderboard."
      : "Profile saves on this device.";
  }

  function renderDailyGoals() {
    el.dailyGoalList.innerHTML = "";
    for (const goal of DAILY_GOALS) {
      const current = state.dailyProgress[goal.id];
      const percent = clamp(Math.round((current / goal.target) * 100), 0, 100);
      const card = document.createElement("article");
      card.className = "goal-card";
      card.innerHTML = [
        "<strong>" + goal.label + "</strong>",
        '<p class="tiny">' + current + " / " + goal.target + "</p>",
        '<div class="goal-progress"><div style="width:' + percent + '%"></div></div>'
      ].join("");
      el.dailyGoalList.appendChild(card);
    }
    el.dailyGoalStatus.textContent = DAILY_GOALS.every((goal) => state.dailyProgress[goal.id] >= goal.target)
      ? "Daily goals complete. Great work."
      : "Daily goals reset each day on this device.";
  }

  function renderAnswerControls() {
    const question = state.currentQuestion;
    const isMultiple = question?.answerType === "multiple";
    el.choiceList.hidden = !isMultiple;
    el.answerInput.hidden = isMultiple;
    if (isMultiple && question?.choices) {
      el.choiceList.innerHTML = "";
      question.choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-button" + (state.selectedChoiceIndex === index ? " is-selected" : "");
        button.textContent = choice.label;
        button.disabled = !state.activeRound;
        button.addEventListener("click", () => {
          state.selectedChoiceIndex = index;
          el.answerInput.value = String(choice.value);
          renderAnswerControls();
        });
        el.choiceList.appendChild(button);
      });
    } else {
      const placeholder = question?.answerType === "coordinate"
        ? "Type an ordered pair like (3, -2)"
        : question?.answerType === "fraction"
          ? "Type a fraction like 3/4 or a decimal"
          : "Type your answer";
      el.answerInput.placeholder = placeholder;
      el.answerInput.inputMode = question?.answerType === "coordinate" ? "text" : "decimal";
    }
  }

  function renderBadges() {
    const badges = getBadges();
    el.badgeList.innerHTML = "";
    for (const badge of badges) {
      const item = document.createElement("div");
      item.className = "badge-chip";
      item.innerHTML = "<strong>" + badge.label + "</strong><span>" + badge.status + "</span>";
      el.badgeList.appendChild(item);
    }
  }

  function renderWeeklyChallenges() {
    const challenges = getWeeklyChallenges();
    el.weeklyChallengeList.innerHTML = "";
    for (const challenge of challenges) {
      const item = document.createElement("article");
      item.className = "goal-card";
      item.innerHTML = [
        "<strong>" + challenge.title + "</strong>",
        '<p class="tiny">' + challenge.detail + "</p>"
      ].join("");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Launch";
      button.addEventListener("click", () => {
        state.selectedMode = "challenge";
        state.selectedSkillId = challenge.skillId;
        startSession(false);
      });
      item.appendChild(button);
      el.weeklyChallengeList.appendChild(item);
    }
  }

  function renderMistakeTracker() {
    el.mistakeTrackerList.innerHTML = "";
    const items = Object.entries(state.mistakeStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "tiny";
      empty.textContent = "Mistakes are tracked by topic and answer type as you practice.";
      el.mistakeTrackerList.appendChild(empty);
      return;
    }
    for (const [label, count] of items) {
      const row = document.createElement("div");
      row.className = "badge-chip";
      row.innerHTML = "<strong>" + label + "</strong><span>" + count + " misses</span>";
      el.mistakeTrackerList.appendChild(row);
    }
  }

  function renderReviewNotebook() {
    el.reviewNotebookList.innerHTML = "";
    const items = state.reviewNotebook.slice(-5).reverse();
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "tiny";
      empty.textContent = "Missed questions and reflections will appear here.";
      el.reviewNotebookList.appendChild(empty);
      return;
    }
    for (const item of items) {
      const row = document.createElement("div");
      row.className = "goal-card";
      row.innerHTML = [
        "<strong>" + item.skill + "</strong>",
        '<p class="tiny">' + item.prompt + "</p>",
        '<p class="tiny">Correct answer: ' + item.answer + "</p>",
        item.reflection ? '<p class="tiny">Reflection: ' + item.reflection + "</p>" : ""
      ].join("");
      el.reviewNotebookList.appendChild(row);
    }
  }

  function renderAssignments() {
    el.assignmentList.innerHTML = "";
    if (!state.assignments.length) {
      const empty = document.createElement("p");
      empty.className = "tiny";
      empty.textContent = "Assign the current skill to this student or import a curriculum map.";
      el.assignmentList.appendChild(empty);
      return;
    }
    for (const item of state.assignments.slice(-5).reverse()) {
      const row = document.createElement("div");
      row.className = "badge-chip";
      row.innerHTML = "<strong>" + item.title + "</strong><span>" + item.skillName + "</span>";
      el.assignmentList.appendChild(row);
    }
  }

  function renderStreakCalendar() {
    el.streakCalendar.innerHTML = "";
    const activeDays = new Set(state.streakHistory);
    for (let i = 27; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const stamp = date.toLocaleDateString("en-CA");
      const cell = document.createElement("div");
      cell.className = "calendar-day" + (activeDays.has(stamp) ? " is-active" : "");
      cell.textContent = String(date.getDate());
      el.streakCalendar.appendChild(cell);
    }
  }

  function renderTeachCard(lesson) {
    const card = TEACHING_CARDS[lesson.strand] || {
      title: "Lesson Preview",
      summary: lesson.description,
      example: "Work step by step and use the hint if you need a nudge."
    };
    el.teachTitle.textContent = card.title;
    el.teachSummary.textContent = card.summary;
    el.teachExample.textContent = card.example;
  }

  function renderLeaderboard() {
    const entries = buildLeaderboardEntries();
    entries.sort((a, b) => (b.mastery + b.xp + b.challengeClears * 8) - (a.mastery + a.xp + a.challengeClears * 8));
    el.leaderboardList.innerHTML = "";
    entries.slice(0, 5).forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "leaderboard-row" + (entry.you ? " is-you" : "");
      row.innerHTML = [
        "<div><strong>" + (index + 1) + ". " + entry.name + "</strong><span>" + entry.medal + " | " + entry.mastery + "% mastery</span></div>",
        "<span>" + entry.challengeClears + " clears</span>"
      ].join("");
      el.leaderboardList.appendChild(row);
    });
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "tiny";
      empty.textContent = state.tableReady
        ? "No online scores yet. Turn on the leaderboard option and publish the first Math Masters score."
        : "Checking the live leaderboard connection...";
      el.leaderboardList.appendChild(empty);
    }
    el.leaderboardStatus.textContent = state.tableReady === null
      ? "Checking the live leaderboard..."
      : state.tableReady
        ? (state.onlineLeaderboard.length
          ? "These are real shared Math Masters scores from the online leaderboard."
          : (state.profile.leaderboardOptIn
            ? "This student is ready to publish the first live online score."
            : "Turn on the leaderboard option in the student profile, then publish this score online."))
        : "Supabase is connected, but the leaderboard table is still missing.";
  }

  function buildLeaderboardEntries() {
    const entries = state.onlineLeaderboard.length
      ? [...state.onlineLeaderboard]
      : [...state.importedLeaderboard];
    return entries;
  }

  function renderGraphVisual() {
    const visual = state.currentQuestion?.visual;
    if (!visual) {
      el.graphVisual.hidden = true;
      el.graphVisual.innerHTML = "";
      return;
    }
    el.graphVisual.hidden = false;
    if (visual.type === "scatter") {
      el.graphVisual.innerHTML = '<svg viewBox="0 0 220 140" width="100%" height="140" aria-label="Scatter plot">' +
        '<line x1="20" y1="120" x2="200" y2="120" stroke="#94afc0"/>' +
        '<line x1="20" y1="120" x2="20" y2="20" stroke="#94afc0"/>' +
        '<circle cx="50" cy="95" r="4" fill="#7de3ff"/>' +
        '<circle cx="90" cy="82" r="4" fill="#7de3ff"/>' +
        '<circle cx="120" cy="64" r="4" fill="#7de3ff"/>' +
        '<circle cx="165" cy="42" r="4" fill="#7de3ff"/>' +
        '<circle cx="190" cy="30" r="4" fill="#7de3ff"/>' +
        '</svg>';
      return;
    }
    if (visual.type === "coordinate") {
      el.graphVisual.innerHTML = '<svg viewBox="0 0 220 220" width="100%" height="180" aria-label="Coordinate plane">' +
        '<rect x="0" y="0" width="220" height="220" fill="rgba(255,255,255,0.02)"/>' +
        '<line x1="110" y1="10" x2="110" y2="210" stroke="#94afc0"/>' +
        '<line x1="10" y1="110" x2="210" y2="110" stroke="#94afc0"/>' +
        '<circle cx="' + (110 + visual.x * 15) + '" cy="' + (110 - visual.y * 15) + '" r="5" fill="#ffd66b"/>' +
        '</svg>';
    }
  }

  function renderParentView() {
    const minutes = Math.round(getTotalPracticeSeconds() / 60);
    const accuracy = state.bestAccuracy;
    const mastery = averageMastery();
    const readiness = mastery >= 70 && accuracy >= 80 ? "Ready to Stretch" : mastery >= 50 ? "On Track" : "Building";
    const nextMove = mastery >= 75 ? "Use Challenge Mode" : rankStrands(true)[0]?.label || "Stay On-Level";
    el.parentMinutes.textContent = String(minutes);
    el.parentMinutesText.textContent = minutes > 0 ? "Minutes practiced across saved sessions on this device." : "Practice time is counted while sessions are active.";
    el.parentSessions.textContent = String(state.totalLessonFocuses);
    el.parentSessionsText.textContent = state.totalLessonFocuses > 0 ? "Focused sessions started so far." : "Short daily sessions build steady growth.";
    el.parentReadiness.textContent = readiness;
    el.parentReadinessText.textContent = "Readiness blends mastery average and best session accuracy.";
    el.parentNextMove.textContent = nextMove;
    el.parentNextMoveText.textContent = mastery >= 75
      ? "The student is ready for more challenge or a mastery test."
      : "Coach the weakest category next, then return to review mode.";
  }

  function syncDailyProgress() {
    state.dailyProgress = normalizeDailyProgress(state.dailyProgress);
  }

  function syncPracticeTime() {
    if (state.sessionStartedAt) {
      state.totalPracticeSeconds += Math.max(0, Math.round((Date.now() - state.sessionStartedAt) / 1000));
      state.sessionStartedAt = Date.now();
    }
  }

  function getTotalPracticeSeconds() {
    if (!state.sessionStartedAt) return state.totalPracticeSeconds;
    return state.totalPracticeSeconds + Math.max(0, Math.round((Date.now() - state.sessionStartedAt) / 1000));
  }

  function getTodayStamp() {
    return new Date().toLocaleDateString("en-CA");
  }

  function parseCurrentAnswer() {
    const raw = el.answerInput.value.trim();
    const answerType = state.currentQuestion?.answerType || "number";
    if (answerType === "coordinate") {
      const match = raw.match(/^\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?$/);
      if (!match) return { valid: false, message: "Type an ordered pair like (3, -2)." };
      return { valid: true, value: [Number(match[1]), Number(match[2])] };
    }
    if (answerType === "fraction") {
      if (raw.includes("/")) {
        const parts = raw.split("/");
        if (parts.length !== 2 || Number(parts[1]) === 0 || parts.some((part) => Number.isNaN(Number(part)))) {
          return { valid: false, message: "Type a fraction like 3/4 or a decimal." };
        }
        return { valid: true, value: Number(parts[0]) / Number(parts[1]) };
      }
      if (Number.isNaN(Number(raw))) return { valid: false, message: "Type a fraction like 3/4 or a decimal." };
      return { valid: true, value: Number(raw) };
    }
    if (answerType === "multiple") {
      if (!raw.length) return { valid: false, message: "Pick one of the choices first." };
      return { valid: true, value: raw };
    }
    if (raw.length === 0 || Number.isNaN(Number(raw))) return { valid: false, message: "Type a number first." };
    return { valid: true, value: Number(raw) };
  }

  function showHint() {
    if (!state.currentQuestion) return;
    state.visibleHint = state.currentQuestion.hint;
    render();
  }

  function sessionLabel() {
    if (state.sessionType === "placement") return "Placement Check";
    if (state.sessionType === "mastery") return "Mastery Test";
    if (state.sessionType === "chapter-test") return "Chapter Test";
    if (state.sessionType === "review") return "Review Mode";
    return "Practice Session";
  }

  function modeLabel(modeId) {
    return MODES.find((mode) => mode.id === modeId)?.label || "On-Level";
  }

  function getBadges() {
    const weakest = rankStrands(true)[0];
    return [
      { label: "Daily Climber", status: state.dailyProgress.lessons >= 2 ? "Unlocked" : "Start 2 lessons today" },
      { label: "Accuracy Ace", status: state.bestAccuracy >= 90 ? "Unlocked" : "Reach 90% accuracy" },
      { label: "Challenge Crusher", status: state.challengeClears >= 3 ? "Unlocked" : "Clear 3 challenge quests" },
      { label: "Mastery Maker", status: masteredSkillCount() >= 5 ? "Unlocked" : "Master 5 skills" },
      { label: "Review Hero", status: weakest && weakest.value >= 55 ? "Unlocked" : "Lift weak categories above 55%" }
    ];
  }

  function masteredSkillCount() {
    return getSkillsForGrade().filter((lesson) => getMastery(lesson.id) >= 85).length;
  }

  function buildHint(prompt, lesson) {
    return "Start with the key relationship in " + strandLabel(lesson.strand) + ". Then solve one step at a time for: " + prompt;
  }

  function buildExplanation(question, lesson) {
    if (question.answerType === "multiple") {
      return "Look for the choice that best matches the pattern or trend described. The correct choice is " + formatAnswer(question.answer) + ".";
    }
    if (question.answerType === "coordinate") {
      return "Track how the x-value and y-value move, then write the image as an ordered pair. The correct point is " + formatAnswer(question.answer) + ".";
    }
    return "Use the structure of " + strandLabel(lesson.strand) + ", work step by step, and compare your result to " + formatAnswer(question.answer) + ".";
  }

  function buildCorrectExplanation(question) {
    return question.answerType === "multiple"
      ? "You picked the best matching choice for the pattern."
      : "You matched the expected answer of " + formatAnswer(question.answer) + ".";
  }

  function playCue(kind) {
    if (!state.profile.soundOn || typeof window.AudioContext === "undefined") return;
    const context = playCue.audioContext || (playCue.audioContext = new window.AudioContext());
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = kind === "celebrate" ? 720 : kind === "miss" ? 220 : 480;
    gain.gain.value = 0.02;
    oscillator.start();
    oscillator.stop(context.currentTime + (kind === "celebrate" ? 0.18 : 0.08));
  }

  function getWeeklyChallenges() {
    const week = getWeekStamp();
    const skills = getSkillsForGrade().slice().sort((a, b) => a.id.localeCompare(b.id));
    return skills.slice(0, 3).map((skill, index) => ({
      title: "Week " + week.split("-W")[1] + " Challenge " + (index + 1),
      detail: skill.name + " in Challenge mode",
      skillId: skill.id
    }));
  }

  function getWeekStamp() {
    const date = new Date();
    const first = new Date(date.getFullYear(), 0, 1);
    const day = Math.floor((date - first) / 86400000);
    const week = Math.ceil((day + first.getDay() + 1) / 7);
    return date.getFullYear() + "-W" + String(week).padStart(2, "0");
  }

  function logMistake(skillId, question, studentResponse) {
    const lesson = getSkillById(skillId);
    const strand = lesson ? strandLabel(lesson.strand) : "General";
    state.mistakeStats[strand] = (state.mistakeStats[strand] || 0) + 1;
    state.mistakeStats[(question.answerType || "number") + " response"] = (state.mistakeStats[(question.answerType || "number") + " response"] || 0) + 1;
    state.reviewNotebook.push({
      date: getTodayStamp(),
      skill: lesson?.name || "Skill",
      prompt: question.prompt,
      answer: formatAnswer(question.answer),
      studentResponse: Array.isArray(studentResponse) ? formatAnswer(studentResponse) : String(studentResponse),
      reflection: ""
    });
    state.reviewNotebook = state.reviewNotebook.slice(-20);
  }

  function recordPracticeDay() {
    const stamp = getTodayStamp();
    if (!state.streakHistory.includes(stamp)) state.streakHistory.push(stamp);
    state.streakHistory = state.streakHistory.slice(-60);
  }

  function integerAddQuestion() {
    const a = modeInt(-20, -45, -90, 20, 45, 90);
    const b = modeInt(-20, -45, -90, 20, 45, 90);
    const c = modeInt(-10, -20, -40, 10, 20, 40);
    return { prompt: "Solve: " + a + " + (" + b + ") - (" + c + ")", answer: a + b - c };
  }

  function integerSubtractQuestion() {
    const a = modeInt(-24, -50, -100, 24, 50, 100);
    const b = modeInt(-18, -35, -70, 18, 35, 70);
    const c = modeInt(-8, -15, -30, 8, 15, 30);
    return { prompt: "Solve: " + a + " - (" + b + ") + (" + c + ")", answer: a - b + c };
  }

  function rationalAddSubtractQuestion() {
    const a = randomChoice([-7.25, -5.5, -3.75, -1.6, 2.4, 4.8, 6.25]);
    const b = randomChoice([-4.5, -2.75, -1.2, 1.35, 2.25, 3.4, 5.5]);
    const c = randomChoice([-2.5, -1.25, 0.75, 1.5, 2.8]);
    return {
      prompt: "Compute: " + a + " + (" + b + ") - (" + c + ")",
      answer: roundTo(a + b - c, 2)
    };
  }

  function rationalMultiplyQuestion() {
    const a = randomChoice([-3.5, -2.4, -1.25, 0.75, 1.2, 2.8, 4.5]);
    const b = randomChoice([-2.5, -1.5, -0.75, 0.4, 1.25, 2.2]);
    const c = randomChoice([0.5, 2, -1]);
    return { prompt: "Compute: (" + a + " x " + b + ") / " + c, answer: roundTo((a * b) / c, 2) };
  }

  function divideRationalsQuestion() {
    const divisor = randomChoice([-2.5, -1.25, -0.5, 0.25, 1.5, 2, 4]);
    const quotient = randomChoice([-8.4, -3.6, -1.75, 2.4, 3.5, 6.2]);
    const dividend = roundTo(divisor * quotient, 2);
    return { prompt: "Divide and simplify: " + dividend + " / " + divisor, answer: roundTo(quotient, 2) };
  }

  function ratioTableQuestion() {
    const left = randomInt(2, 5);
    const factor = randomInt(3, 7);
    const right = left * factor;
    const second = randomInt(6, 10);
    return { prompt: "If " + left + " : " + right + " = " + second + " : x, what is x?", answer: second * factor };
  }

  function unitRateQuestion() {
    const items = randomInt(3, 12);
    const total = items * randomChoice([1.5, 2, 2.5, 3, 4]);
    return { prompt: "A store charges $" + total.toFixed(2) + " for " + items + " notebooks. What is the cost per notebook?", answer: roundTo(total / items, 2) };
  }

  function proportionalTableQuestion() {
    const x1 = randomInt(3, 8);
    const y1 = randomInt(12, 36);
    const scale = randomChoice([1.5, 2, 2.5, 3]);
    const x2 = x1 * scale;
    return {
      prompt: "A proportional relationship has points (" + x1 + ", " + y1 + ") and (" + x2 + ", y). Find y.",
      answer: roundTo((y1 / x1) * x2, 2)
    };
  }

  function percentChangeQuestion() {
    const original = modeChoice([48, 64, 75, 96], [96, 120, 150, 180], [180, 240, 320, 450]);
    const percent = modeChoice([10, 12, 15], [18, 20, 25, 30], [18, 22, 25, 30, 35]);
    if (Math.random() < 0.5) {
      return {
        prompt: "A jacket costs $" + original + ". It is discounted " + percent + "% and then taxed 6%. What is the final price?",
        answer: roundTo(original * (1 - percent / 100) * 1.06, 2)
      };
    }
    return {
      prompt: "A value of " + original + " increases by " + percent + "% and then decreases by 10%. What is the final value?",
      answer: roundTo(original * (1 + percent / 100) * 0.9, 2)
    };
  }

  function taxTipQuestion() {
    const meal = randomChoice([24, 36, 48, 52, 64, 75]);
    const tip = randomChoice([15, 18, 20]);
    const tax = randomChoice([6, 7, 8]);
    return {
      prompt: "A meal costs $" + meal + ". Add " + tax + "% tax and " + tip + "% tip. What is the total bill?",
      answer: roundTo(meal * (1 + tax / 100 + tip / 100), 2)
    };
  }

  function decimalOperationQuestion() {
    const a = randomChoice([1.2, 3.4, 5.6, 7.8, 9.1]);
    const b = randomChoice([0.2, 0.5, 1.4, 2.5, 3.2]);
    return Math.random() < 0.5
      ? { prompt: "Add: " + a + " + " + b, answer: roundTo(a + b, 2) }
      : { prompt: "Multiply: " + a + " x " + b, answer: roundTo(a * b, 2) };
  }

  function fractionMultiplyQuestion() {
    const a = randomChoice([[1, 2], [2, 3], [3, 4], [4, 5]]);
    const b = randomChoice([[1, 3], [2, 5], [3, 5], [5, 6]]);
    return {
      prompt: "Multiply: " + a[0] + "/" + a[1] + " x " + b[0] + "/" + b[1],
      answer: roundTo((a[0] / a[1]) * (b[0] / b[1]), 4),
      answerType: "fraction",
      hint: "Multiply the numerators, multiply the denominators, then simplify or write a decimal.",
      explanation: "Multiply across: " + a[0] + " x " + b[0] + " over " + a[1] + " x " + b[1] + ". Then simplify the result."
    };
  }

  function fractionDivideQuestion() {
    const a = randomChoice([[1, 2], [2, 3], [3, 4], [5, 6]]);
    const b = randomChoice([[1, 3], [2, 5], [3, 5], [4, 7]]);
    return {
      prompt: "Divide: " + a[0] + "/" + a[1] + " / " + b[0] + "/" + b[1],
      answer: roundTo((a[0] / a[1]) / (b[0] / b[1]), 4),
      answerType: "fraction",
      hint: "Keep the first fraction, flip the second fraction, and multiply.",
      explanation: "Dividing by a fraction means multiplying by its reciprocal, so " + a[0] + "/" + a[1] + " x " + b[1] + "/" + b[0] + " gives the correct result."
    };
  }

  function fractionDecimalConversionQuestion() {
    const pair = randomChoice([
      {
        prompt: "Convert 3/4 to a decimal.",
        answer: 0.75,
        hint: "Think of 3 divided by 4.",
        explanation: "Divide 3 by 4 to get 0.75."
      },
      {
        prompt: "Convert 5/8 to a decimal.",
        answer: 0.625,
        hint: "Think of 5 divided by 8.",
        explanation: "Divide 5 by 8 to get 0.625."
      },
      {
        prompt: "Convert 0.375 to a fraction in simplest form. You may enter a fraction or a decimal equivalent.",
        answer: 0.375,
        answerType: "fraction",
        hint: "Read 0.375 as 375 thousandths, then simplify.",
        explanation: "0.375 = 375/1000, and simplifying gives 3/8."
      },
      {
        prompt: "Convert 7/20 to a decimal.",
        answer: 0.35,
        hint: "Make the denominator 100 or divide 7 by 20.",
        explanation: "7/20 = 35/100 = 0.35."
      }
    ]);
    return pair;
  }

  function expressionEvaluationQuestion() {
    const x = randomInt(-6, 8);
    const a = randomInt(2, 7);
    const b = randomInt(2, 5);
    const c = randomInt(3, 12);
    return { prompt: "Evaluate " + a + "(x - " + b + ") + " + c + " when x = " + x + ".", answer: a * (x - b) + c };
  }

  function equivalentExpressionsQuestion() {
    const x = randomInt(-4, 7);
    const a = randomInt(2, 6);
    const b = randomInt(2, 8);
    const c = randomInt(2, 5);
    return { prompt: "Evaluate " + a + "(x + " + b + ") - " + c + "x when x = " + x + ".", answer: a * (x + b) - c * x };
  }

  function twoStepEquationQuestion() {
    const x = modeInt(-4, -8, -16, 8, 12, 20);
    const coefficient = modeChoice([2, 3, 4], [3, 4, 5, 6, 7], [5, 6, 7, 8, 9]);
    const addend = modeInt(-6, -12, -24, 8, 15, 28);
    const right = coefficient * x + addend;
    return { prompt: "Solve for x: " + coefficient + "x + (" + addend + ") = " + right, answer: x };
  }

  function multiStepEquationQuestion() {
    const x = modeInt(-3, -4, -10, 6, 9, 15);
    const a = modeChoice([2, 3], [2, 3, 4, 5], [4, 5, 6, 7]);
    const b = modeChoice([1, 2, 3], [2, 3, 4, 5, 6, 7], [4, 5, 6, 7, 8, 9]);
    const c = modeChoice([2, 3], [2, 3, 4, 5, 6], [4, 5, 6, 7, 8]);
    const d = a * (x + b) - c;
    return { prompt: "Solve: " + a + "(x + " + b + ") - " + c + " = " + d, answer: x };
  }

  function variablesBothSidesQuestion() {
    const x = randomInt(-4, 10);
    const leftCoeff = randomInt(3, 8);
    const rightCoeff = randomInt(1, leftCoeff - 1);
    const leftConst = randomInt(-8, 12);
    const rightConst = leftCoeff * x + leftConst - rightCoeff * x;
    return {
      prompt: "Solve: " + leftCoeff + "x + (" + leftConst + ") = " + rightCoeff + "x + " + rightConst,
      answer: x
    };
  }

  function equationWordProblemQuestion() {
    const tickets = randomInt(4, 11);
    const fee = randomChoice([12, 15, 18, 20]);
    const total = tickets * fee + randomChoice([8, 10, 12]);
    const extra = total - tickets * fee;
    return {
      prompt: "A club pays $" + total + " total for " + tickets + " tickets and one fixed fee. Each ticket costs $" + fee + ". What is the fixed fee?",
      answer: extra
    };
  }

  function inequalityQuestion() {
    const x = randomInt(4, 14);
    const coefficient = randomInt(2, 6);
    const addend = randomInt(-6, 8);
    const bound = coefficient * x + addend - randomInt(1, coefficient);
    return { prompt: "What is the least integer x that makes " + coefficient + "x + (" + addend + ") > " + bound + " true?", answer: x };
  }

  function triangleAreaQuestion() {
    const base = randomInt(4, 14);
    const height = randomInt(3, 12);
    return { prompt: "Find the area of a triangle with base " + base + " and height " + height + ".", answer: (base * height) / 2 };
  }

  function scaleDrawingQuestion() {
    const scale = randomChoice([4, 5, 8, 10, 12]);
    const drawing = randomChoice([2.5, 3, 4.5, 6, 7.2]);
    return {
      prompt: "On a scale drawing, 1 inch represents " + scale + " feet. A wall measures " + drawing + " inches on the drawing. What is the actual length in feet?",
      answer: roundTo(drawing * scale, 2)
    };
  }

  function angleRelationshipQuestion() {
    const x = randomInt(8, 24);
    const angleA = 4 * x + 8;
    const angleB = 180 - angleA;
    return {
      prompt: "Two angles form a straight line. One angle measures 4x + 8 degrees and x = " + x + ". What is the other angle?",
      answer: angleB,
      hint: "Angles on a straight line add to 180 degrees.",
      explanation: "First find the given angle: 4(" + x + ") + 8 = " + angleA + ". Then subtract from 180: 180 - " + angleA + " = " + angleB + "."
    };
  }

  function coordinateDistanceQuestion() {
    const x1 = randomInt(-8, 4);
    const y1 = randomInt(-6, 6);
    const horizontal = Math.random() < 0.5;
    const change = randomInt(3, 12);
    if (horizontal) {
      return {
        prompt: "Points (" + x1 + ", " + y1 + ") and (" + (x1 + change) + ", " + y1 + ") lie on a horizontal line. What is the distance between them?",
        answer: change
      };
    }
    return {
      prompt: "Points (" + x1 + ", " + y1 + ") and (" + x1 + ", " + (y1 - change) + ") lie on a vertical line. What is the distance between them?",
      answer: change
    };
  }

  function circleQuestion() {
    const radius = modeChoice([4, 5, 6, 7, 8], [6, 8, 10, 12, 14], [10, 12, 15, 18, 20]);
    if (Math.random() < 0.5) {
      return {
        prompt: "Use pi = 3.14. A circle has radius " + radius + ". What is the circumference?",
        answer: roundTo(2 * 3.14 * radius, 2),
        hint: "Circumference uses C = 2pi r.",
        explanation: "Use C = 2(3.14)(" + radius + ") = " + roundTo(2 * 3.14 * radius, 2) + "."
      };
    }
    return {
      prompt: "Use pi = 3.14. A circle has diameter " + (radius * 2) + ". Find its area.",
      answer: roundTo(3.14 * radius * radius, 2),
      hint: "Area uses A = pi r^2, so find the radius first.",
      explanation: "The radius is " + radius + ", so A = 3.14(" + radius + "^2) = " + roundTo(3.14 * radius * radius, 2) + "."
    };
  }

  function surfaceAreaQuestion() {
    const l = modeChoice([4, 5, 6, 7], [6, 8, 10, 12], [10, 12, 14, 16]);
    const w = modeChoice([3, 4, 5, 6], [5, 6, 8, 10], [8, 10, 12, 14]);
    const h = modeChoice([5, 6, 7, 8], [8, 10, 12, 14], [12, 14, 16, 18]);
    return { prompt: "Find the surface area of a rectangular prism with l = " + l + ", w = " + w + ", h = " + h + ".", answer: 2 * (l * w + l * h + w * h) };
  }

  function volumePrismQuestion() {
    const l = modeChoice([4, 5, 6, 7], [6, 8, 10, 12], [10, 12, 14, 16]);
    const w = modeChoice([3, 4, 5, 6], [5, 6, 8, 10], [8, 10, 12, 14]);
    const h = modeChoice([5, 6, 7, 8], [8, 10, 12, 14], [12, 14, 16, 18]);
    return { prompt: "A rectangular prism has dimensions " + l + " by " + w + " by " + h + ". Find volume.", answer: l * w * h };
  }

  function translationQuestion() {
    const x = randomInt(-4, 4);
    const dx = randomInt(-5, 5);
    const dy = randomInt(-5, 5);
    return { prompt: "Point (" + x + ", " + randomInt(-4, 4) + ") is translated by <" + dx + ", " + dy + ">. What is the new x-coordinate?", answer: x + dx };
  }

  function reflectionQuestion() {
    const x = randomInt(-6, 6);
    const y = randomInt(-6, 6);
    return Math.random() < 0.5
      ? { prompt: "Reflect (" + x + ", " + y + ") across the y-axis. What is the new x-coordinate?", answer: -x }
      : { prompt: "Reflect (" + x + ", " + y + ") across the x-axis. What is the new y-coordinate?", answer: -y };
  }

  function rotationQuestion() {
    const x = randomInt(-6, 6) || 2;
    const y = randomInt(-6, 6) || -3;
    if (Math.random() < 0.5) {
      return {
        prompt: "Rotate (" + x + ", " + y + ") 90 degrees counterclockwise about the origin. What is the new x-coordinate?",
        answer: -y
      };
    }
    return {
      prompt: "Rotate (" + x + ", " + y + ") 180 degrees about the origin. What is the new y-coordinate?",
      answer: -y
    };
  }

  function inequalityGraphQuestion() {
    const boundary = randomInt(-6, 10);
    const direction = Math.random() < 0.5 ? "greater than" : "less than";
    if (direction === "greater than") {
      return {
        prompt: "A graph shows all values greater than " + boundary + " with an open circle at " + boundary + ". What is the least integer solution?",
        answer: boundary + 1
      };
    }
    return {
      prompt: "A graph shows all values less than " + boundary + " with an open circle at " + boundary + ". What is the greatest integer solution?",
      answer: boundary - 1
    };
  }

  function probabilityQuestion() {
    const favorable = modeChoice([2, 3, 4], [3, 4, 5, 6, 7], [5, 6, 7, 8, 9]);
    const other = modeChoice([3, 4, 5], [4, 5, 6, 7, 8, 9], [7, 8, 9, 10, 11]);
    const extra = modeChoice([1, 2, 3], [2, 3, 4, 5], [4, 5, 6, 7]);
    const total = favorable + other + extra;
    return { prompt: "A bag has " + favorable + " red, " + other + " blue, and " + extra + " green marbles. What is P(not blue) as a decimal?", answer: roundTo((favorable + extra) / total, 2) };
  }

  function meanQuestion() {
    const values = Array.from({ length: 5 }, () => randomInt(-6, 22));
    const total = values.reduce((sum, value) => sum + value, 0);
    return { prompt: "Find the mean of " + values.join(", ") + ".", answer: roundTo(total / values.length, 2) };
  }

  function meanAbsoluteDeviationQuestion() {
    const values = Array.from({ length: 4 }, () => randomChoice([4, 6, 8, 10, 12, 14, 16]));
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const mad = values.reduce((sum, value) => sum + Math.abs(value - mean), 0) / values.length;
    return {
      prompt: "Find the mean absolute deviation of " + values.join(", ") + ".",
      answer: roundTo(mad, 2),
      hint: "Find the mean first, then average the distances from the mean.",
      explanation: "The mean is " + roundTo(mean, 2) + ". Then find each distance from the mean and average those distances to get " + roundTo(mad, 2) + "."
    };
  }

  function squareRootQuestion() {
    const value = randomChoice([16, 25, 36, 49, 64, 81, 100, 121]);
    return { prompt: "What is the principal square root of " + value + "?", answer: Math.sqrt(value) };
  }

  function scientificNotationQuestion() {
    const pair = randomChoice([
      {
        prompt: "Write 4.5 x 10^6 as a standard number.",
        answer: 4500000,
        hint: "Move the decimal 6 places to the right.",
        explanation: "4.5 x 10^6 means 4.5 multiplied by 1,000,000, which is 4,500,000."
      },
      {
        prompt: "Write 7.2 x 10^-4 as a decimal.",
        answer: 0.00072,
        hint: "Move the decimal 4 places to the left.",
        explanation: "A negative exponent means move the decimal left, so 7.2 becomes 0.00072."
      },
      {
        prompt: "Write 8300000 in scientific notation. Enter the coefficient only.",
        answer: 8.3,
        hint: "Move the decimal so the coefficient is between 1 and 10.",
        explanation: "8,300,000 = 8.3 x 10^6, so the coefficient is 8.3."
      },
      {
        prompt: "Write 0.00056 in scientific notation. Enter the coefficient only.",
        answer: 5.6,
        hint: "Move the decimal so the coefficient is between 1 and 10.",
        explanation: "0.00056 = 5.6 x 10^-4, so the coefficient is 5.6."
      }
    ]);
    return pair;
  }

  function linearPatternQuestion() {
    const start = randomInt(-8, 12);
    const rate = randomInt(3, 9);
    const n = randomInt(8, 15);
    return { prompt: "A linear pattern starts at " + start + " and increases by " + rate + " each term. What is term " + n + "?", answer: start + rate * (n - 1) };
  }

  function slopeQuestion() {
    const x1 = modeInt(-4, -6, -12, 4, 4, 10);
    const rise = modeChoice([-4, -3, -2, 2, 3, 4], [-8, -6, -4, 4, 6, 8], [-12, -9, -6, 6, 9, 12]);
    const run = modeChoice([2, 3, 4], [2, 3, 4, 5, 6], [3, 4, 5, 6, 8]);
    const y1 = modeInt(-4, -8, -14, 6, 10, 14);
    return { prompt: "Find the slope between (" + x1 + ", " + y1 + ") and (" + (x1 + run) + ", " + (y1 + rise) + "). Enter a decimal if needed.", answer: roundTo(rise / run, 2) };
  }

  function compositeAreaQuestion() {
    const widthA = randomChoice([4, 5, 6, 8]);
    const heightA = randomChoice([6, 7, 8, 10]);
    const widthB = randomChoice([2, 3, 4]);
    const heightB = randomChoice([3, 4, 5]);
    return {
      prompt: "A composite figure is made from a " + widthA + " by " + heightA + " rectangle and a " + widthB + " by " + heightB + " rectangle attached with no overlap. What is the total area in square units?",
      answer: widthA * heightA + widthB * heightB,
      hint: "Find each rectangle's area, then add them.",
      explanation: "The two areas are " + widthA + " x " + heightA + " = " + (widthA * heightA) + " and " + widthB + " x " + heightB + " = " + (widthB * heightB) + ". Their total is " + (widthA * heightA + widthB * heightB) + "."
    };
  }

  function scatterPlotQuestion() {
    return {
      prompt: "A scatter plot shows that as study time increases, quiz scores usually increase. Which statement best describes the association?",
      answer: "positive",
      answerType: "multiple",
      visual: { type: "scatter" },
      choices: [
        { label: "Positive association", value: "positive" },
        { label: "Negative association", value: "negative" },
        { label: "No association", value: "none" }
      ],
      hint: "Ask whether both variables tend to rise together, move opposite ways, or stay unrelated.",
      explanation: "Because higher study time is usually paired with higher quiz scores, the relationship is positive."
    };
  }

  function multiStepInequalityQuestion() {
    const x = randomInt(3, 10);
    const a = randomChoice([2, 3, 4]);
    const b = randomChoice([4, 6, 8]);
    const c = randomChoice([3, 5, 7]);
    const bound = a * x + b + c - randomChoice([1, 2]);
    return {
      prompt: "What is the least integer x that makes " + a + "x + " + b + " + " + c + " > " + bound + " true?",
      answer: x
    };
  }

  function functionTableQuestion() {
    const input = randomChoice([3, 4, 5, 6]);
    const multiplier = randomChoice([2, 3, 4]);
    const addend = randomChoice([1, 2, 5, 7]);
    return {
      prompt: "A function rule is y = " + multiplier + "x + " + addend + ". What is the output when x = " + input + "?",
      answer: multiplier * input + addend,
      hint: "Substitute the input value for x in the rule.",
      explanation: "Replace x with " + input + ": y = " + multiplier + "(" + input + ") + " + addend + " = " + (multiplier * input + addend) + "."
    };
  }

  function translatedPointQuestion() {
    const x = randomInt(-5, 5);
    const y = randomInt(-5, 5);
    const dx = randomChoice([-4, -3, 2, 5]);
    const dy = randomChoice([-3, -2, 4, 5]);
    return {
      prompt: "Translate (" + x + ", " + y + ") by <" + dx + ", " + dy + ">. Enter the image as an ordered pair.",
      answer: [x + dx, y + dy],
      answerType: "coordinate",
      visual: { type: "coordinate", x, y },
      hint: "Add the horizontal move to x and the vertical move to y.",
      explanation: "Add " + dx + " to the x-coordinate and " + dy + " to the y-coordinate to get (" + (x + dx) + ", " + (y + dy) + ")."
    };
  }

  function pythagoreanPreviewQuestion() {
    const pair = randomChoice([
      { legs: [3, 4], hypotenuse: 5 },
      { legs: [5, 12], hypotenuse: 13 },
      { legs: [8, 15], hypotenuse: 17 }
    ]);
    return {
      prompt: "A right triangle has legs " + pair.legs[0] + " and " + pair.legs[1] + ". What is the hypotenuse?",
      answer: pair.hypotenuse,
      hint: "Look for a common Pythagorean triple.",
      explanation: pair.legs[0] + "^2 + " + pair.legs[1] + "^2 = " + (pair.legs[0] * pair.legs[0]) + " + " + (pair.legs[1] * pair.legs[1]) + " = " + (pair.hypotenuse * pair.hypotenuse) + ", so the hypotenuse is " + pair.hypotenuse + "."
    };
  }

  function modeChoice(warmup, onlevel, challenge) {
    if (state.selectedMode === "warmup") return randomChoice(warmup);
    if (state.selectedMode === "challenge") return randomChoice(challenge);
    return randomChoice(onlevel);
  }

  function modeInt(warmMin, onMin, challengeMin, warmMax, onMax, challengeMax) {
    if (state.selectedMode === "warmup") return randomInt(warmMin, warmMax);
    if (state.selectedMode === "challenge") return randomInt(challengeMin, challengeMax);
    return randomInt(onMin, onMax);
  }

  function isAnswerCorrect(input, expected, answerType) {
    if (answerType === "coordinate") {
      return Array.isArray(input) && Array.isArray(expected) && Math.abs(input[0] - expected[0]) < 0.01 && Math.abs(input[1] - expected[1]) < 0.01;
    }
    if (answerType === "multiple") {
      return input === expected;
    }
    return Math.abs(input - expected) < 0.01;
  }

  function formatAnswer(answer) {
    if (Array.isArray(answer)) return "(" + answer[0] + ", " + answer[1] + ")";
    return Number.isInteger(answer) ? String(answer) : answer.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function roundTo(value, digits) {
    const power = Math.pow(10, digits);
    return Math.round(value * power) / power;
  }

  function normalizeSearchText(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function randomChoice(values) {
    return values[randomInt(0, values.length - 1)];
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function returnToMenu() {
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../index.html";
  }

  function tick() {
    if (inputState.keys.escape && !inputState.previous.escape) returnToMenu();
    inputState.previous = { ...inputState.keys };
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
