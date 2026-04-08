(function () {
  const STORAGE_KEY = "math-masters-progress-v3";
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
    skill("g8-scientific-notation", "grade8", "7", "7.4", "accelerated", "Chapter 7: Real Numbers", "Scientific Notation", "8.EE scientific notation", "Original practice aligned to a public-style Grade 8 lesson flow.", "Convert values into or out of scientific notation.", scientificNotationQuestion)
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
    dashboardLeaderboardText: document.getElementById("dashboardLeaderboardText")
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

  let state = createState();
  refreshSelectedSkill();
  render();
  el.startButton.addEventListener("click", startSession);
  el.skipButton.addEventListener("click", skipQuestion);
  el.answerForm.addEventListener("submit", submitAnswer);

  function createState() {
    const saved = loadProgress();
    return {
      activeRound: false,
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
      currentQuestion: null
    };
  }

  function createEmptyMastery() {
    const mastery = {};
    for (const lesson of SKILLS) mastery[lesson.id] = 0;
    return mastery;
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (!state.activeRound || !state.currentQuestion) return;
    const raw = el.answerInput.value.trim();
    if (raw.length === 0 || Number.isNaN(Number(raw))) {
      setFeedback("Type a number first.", false);
      return;
    }
    const answer = Number(raw);
    const isCorrect = isAnswerCorrect(answer, state.currentQuestion.answer);
    state.questionsAnswered += 1;
    if (isCorrect) {
      state.correctAnswers += 1;
      state.streak += 1;
      state.questProgress += 1;
      state.score += 35 + state.streak * 6;
      awardXp(18);
      adjustMastery(state.selectedSkillId, 9);
      setFeedback("Correct. Keep stacking clean reps.", true);
    } else {
      state.streak = 0;
      state.questProgress = 0;
      adjustMastery(state.selectedSkillId, -4);
      setFeedback("Not quite. Correct answer: " + formatAnswer(state.currentQuestion.answer) + ".", false);
    }
    if (state.questProgress >= state.questGoal) {
      state.score += 140;
      awardXp(28);
      state.questProgress = 0;
      state.questGoal = 4 + Math.floor(Math.random() * 4);
      if (state.selectedMode === "challenge") state.challengeClears += 1;
      setFeedback("Quest complete. Your pathway just leveled up.", true);
    }
    state.bestAccuracy = Math.max(state.bestAccuracy, Math.round((state.correctAnswers / state.questionsAnswered) * 100));
    nextQuestion();
    saveProgress();
    render();
  }

  function startSession() {
    state.activeRound = true;
    state.streak = 0;
    state.score = 0;
    state.questionsAnswered = 0;
    state.correctAnswers = 0;
    state.questProgress = 0;
    state.questGoal = 5;
    refreshSelectedSkill();
    nextQuestion();
    state.totalLessonFocuses += 1;
    setFeedback("Session started. Stay sharp and steady.", true);
    render();
    el.answerInput.focus();
  }

  function skipQuestion() {
    if (!state.activeRound) return;
    state.streak = 0;
    state.questProgress = 0;
    state.score = Math.max(0, state.score - 10);
    adjustMastery(state.selectedSkillId, -2);
    setFeedback("Skipped. Reset and take the next rep.", false);
    nextQuestion();
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
    state.selectedSkillId = lesson.id;
    state.currentQuestion = lesson.generate();
    el.answerInput.value = "";
  }

  function chooseSkill() {
    const pool = getVisibleSkills();
    const ranked = [...pool].sort((a, b) => getMastery(a.id) - getMastery(b.id));
    return Math.random() < 0.72 ? ranked[0] : ranked[randomInt(0, ranked.length - 1)];
  }

  function getGradePath() {
    return GRADE_PATHS.find((path) => path.id === state.selectedGrade) || GRADE_PATHS[0];
  }

  function getVisibleSkills() {
    return SKILLS.filter((lesson) => lesson.grade === state.selectedGrade && (state.selectedStrand === "all" || lesson.strand === state.selectedStrand));
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

  function adjustMastery(skillId, delta) {
    state.skillMastery[skillId] = clamp(getMastery(skillId) + delta, 0, 100);
  }

  function awardXp(amount) {
    state.xp += amount;
    while (state.xp >= 100) {
      state.xp -= 100;
      state.level += 1;
    }
  }

  function render() {
    const lesson = getSkillById(state.selectedSkillId) || getVisibleSkills()[0];
    const accuracy = state.questionsAnswered === 0 ? 100 : Math.round((state.correctAnswers / state.questionsAnswered) * 100);
    const path = getGradePath();
    el.pathwayTitle.textContent = path.title;
    el.pathwayDescription.textContent = path.description;
    renderPathwayBadges();
    renderGradeFilters();
    renderStrands();
    renderModes();
    renderSkillList();
    renderRoadmap();
    renderDashboard();
    if (lesson) {
      el.skillName.textContent = lesson.name;
      el.skillMeta.textContent = lesson.unit + " | " + strandLabel(lesson.strand);
      el.lessonCode.textContent = "Chapter " + lesson.chapter + " | Lesson " + lesson.lesson;
      el.skillDescription.textContent = lesson.description;
      el.standardText.textContent = lesson.standard;
      el.alignmentText.textContent = lesson.alignment;
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
    el.answerInput.disabled = !state.activeRound;
    el.submitButton.disabled = !state.activeRound;
    el.skipButton.disabled = !state.activeRound;
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
      "A future public board can show medal tier, XP, mastery average, challenge clears, and strongest categories.";
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
        state.currentQuestion = null;
        refreshSelectedSkill();
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
        state.currentQuestion = null;
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
        state.currentQuestion = null;
        refreshSelectedSkill();
        saveProgress();
        render();
      });
      el.strandFilters.appendChild(button);
    }
  }

  function renderSkillList() {
    el.skillList.innerHTML = "";
    for (const lesson of getVisibleSkills()) {
      const mastery = getMastery(lesson.id);
      const item = document.createElement("article");
      item.className = "skill-item" + (lesson.id === state.selectedSkillId ? " is-selected" : "");
      item.innerHTML = [
        '<div class="skill-item__top">',
        "<div>",
        '<h3 class="skill-item__name">' + lesson.name + "</h3>",
        '<p class="skill-item__meta">' + lesson.unit + " | Lesson " + lesson.lesson + "</p>",
        "</div>",
        '<span class="skill-item__tag">' + mastery + "%</span>",
        "</div>",
        '<p class="skill-item__meta">' + lesson.description + "</p>",
        '<div class="xp-track"><div style="width:' + mastery + '%;height:100%;background:linear-gradient(90deg,#7de3ff,#52d273)"></div></div>',
        '<div class="skill-item__footer">',
        '<span class="skill-item__meta">Chapter ' + lesson.chapter + " | " + lesson.standard + "</span>",
        '<button type="button" class="skill-item__action">Focus</button>',
        "</div>"
      ].join("");
      item.querySelector(".skill-item__action").addEventListener("click", () => {
        state.selectedSkillId = lesson.id;
        state.currentQuestion = state.activeRound ? lesson.generate() : null;
        saveProgress();
        render();
      });
      el.skillList.appendChild(item);
    }
  }

  function renderRoadmap() {
    const grouped = [];
    for (const lesson of getSkillsForGrade()) {
      let unit = grouped.find((entry) => entry.name === lesson.unit);
      if (!unit) {
        unit = { name: lesson.unit, chapter: lesson.chapter, count: 0 };
        grouped.push(unit);
      }
      unit.count += 1;
    }
    el.roadmapList.innerHTML = "";
    for (const unit of grouped) {
      const item = document.createElement("article");
      item.className = "roadmap-item";
      item.innerHTML = [
        '<div class="roadmap-item__top">',
        '<h3 class="roadmap-item__title">' + unit.name + "</h3>",
        '<span class="roadmap-item__badge">' + unit.count + " lessons</span>",
        "</div>",
        '<p class="roadmap-item__meta">Chapter ' + unit.chapter + "</p>"
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
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        xp: state.xp,
        level: state.level,
        totalLessonFocuses: state.totalLessonFocuses,
        challengeClears: state.challengeClears,
        bestAccuracy: state.bestAccuracy,
        selectedGrade: state.selectedGrade,
        selectedStrand: state.selectedStrand,
        selectedMode: state.selectedMode,
        selectedSkillId: state.selectedSkillId,
        skillMastery: state.skillMastery
      }));
    } catch {
      // Ignore storage failures.
    }
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
    return { prompt: "Multiply: " + a[0] + "/" + a[1] + " x " + b[0] + "/" + b[1], answer: roundTo((a[0] / a[1]) * (b[0] / b[1]), 2) };
  }

  function fractionDivideQuestion() {
    const a = randomChoice([[1, 2], [2, 3], [3, 4], [5, 6]]);
    const b = randomChoice([[1, 3], [2, 5], [3, 5], [4, 7]]);
    return { prompt: "Divide: " + a[0] + "/" + a[1] + " / " + b[0] + "/" + b[1], answer: roundTo((a[0] / a[1]) / (b[0] / b[1]), 2) };
  }

  function fractionDecimalConversionQuestion() {
    const pair = randomChoice([
      { prompt: "Convert 3/4 to a decimal.", answer: 0.75 },
      { prompt: "Convert 5/8 to a decimal.", answer: 0.625 },
      { prompt: "Convert 0.375 to a fraction as a decimal answer check.", answer: 0.375 },
      { prompt: "Convert 7/20 to a decimal.", answer: 0.35 }
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
    const x = randomInt(8, 28);
    const angleA = 3 * x + 12;
    const angleB = 180 - angleA;
    return {
      prompt: "Two angles form a straight line. One angle measures 3x + 12 and x = " + x + ". What is the other angle?",
      answer: angleB
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
        prompt: "Use pi = 3.14. A circle has radius " + radius + ". Find the area minus the circumference.",
        answer: roundTo(3.14 * radius * radius - 2 * 3.14 * radius, 2)
      };
    }
    return {
      prompt: "Use pi = 3.14. A circle has diameter " + (radius * 2) + ". Find its area.",
      answer: roundTo(3.14 * radius * radius, 2)
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
      answer: roundTo(mad, 2)
    };
  }

  function squareRootQuestion() {
    const value = randomChoice([16, 25, 36, 49, 64, 81, 100, 121]);
    return { prompt: "What is the principal square root of " + value + "?", answer: Math.sqrt(value) };
  }

  function scientificNotationQuestion() {
    const pair = randomChoice([
      { prompt: "Write 4500000 in scientific notation. Enter the coefficient only.", answer: 4.5 },
      { prompt: "Write 0.00072 in scientific notation. Enter the coefficient only.", answer: 7.2 },
      { prompt: "4.8 x 10^5 equals what standard number divided by 100000?", answer: 4.8 },
      { prompt: "6.3 x 10^-4 has what coefficient?", answer: 6.3 }
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

  function isAnswerCorrect(input, expected) {
    return Math.abs(input - expected) < 0.01;
  }

  function formatAnswer(answer) {
    return Number.isInteger(answer) ? String(answer) : answer.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function roundTo(value, digits) {
    const power = Math.pow(10, digits);
    return Math.round(value * power) / power;
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
