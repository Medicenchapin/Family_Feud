// Cargar sonidos
const flipSound = new Audio("sounds/flip.wav");
const awardSound = new Audio("sounds/points.wav");
const wrongSound = new Audio("sounds/wrong.wav");
const failSound = new Audio("sounds/fail.wav");

var app = {
  version: 1,
  currentQ: 0,
  errorsLeft: 0,
  jsonFile: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/40041/FF3.json",

  board: $("<div class='gameBoard'>"+
    "<div class='score' id='boardScore'>0</div>"+
    "<div class='score' id='team1'>0</div>"+
    "<div class='score' id='team2'>0</div>"+
    "<div class='score' id='errorCount'></div>"+
    "<div class='questionHolder'><span class='question'></span></div>"+
    "<div class='colHolder'><div class='col1'></div><div class='col2'></div></div>"+
    "<div class='btnHolder'>"+
      "<div id='awardTeam1' data-team='1' class='button'>Los Cabrones</div>"+
      "<div id='newQuestion' class='button'>New Question</div>"+
      "<div id='awardTeam2' data-team='2' class='button'>Los ChepaCumLaude</div>"+
      "<div id='addError' class='button'>Error</div>"+
    "</div>"+
  "</div>"),

  shuffle: function(array){
    let currentIndex = array.length, temp, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      temp = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temp;
    }
    return array;
  },

  jsonLoaded: function(data){
    console.clear();
    app.allData = data;
    app.questions = Object.keys(data);
    app.shuffle(app.questions);
    app.makeQuestion(app.currentQ);
    $('body').append(app.board);
  },

  makeQuestion: function(qNum){
    let qText = app.questions[qNum];
    let qAnswr = app.allData[qText];

    let qNumCards = qAnswr.length;
    qNumCards = (qNumCards < 8) ? 8 : qNumCards;
    qNumCards = (qNumCards % 2 !== 0) ? qNumCards + 1 : qNumCards;

    app.errorsLeft = 0;
    app.board.find("#errorCount").html("");

    let boardScore = app.board.find("#boardScore");
    let question = app.board.find(".question");
    let col1 = app.board.find(".col1");
    let col2 = app.board.find(".col2");

    boardScore.html(0);
    question.html('<span style="font-family: Monoton, cursive; font-size: 54px; color: #ffd700; text-shadow: 0 0 10px #ffffff, 0 0 20px #ffffff, 0 0 30px #ffd700;">ChapiOlimpiadas</span>');

    col1.empty();
    col2.empty();

    // Mostrar en consola la pregunta y respuestas
    console.log("%c📣 NUEVA PREGUNTA:", "color: #78be20; font-weight: bold;");
    console.log(qText);
    console.log("%c🧠 RESPUESTAS:", "color: #48a23f; font-weight: bold;");
    qAnswr.forEach((a, i) => {
      console.log(`#${i + 1}: ${a[0]} — ${a[1]} pts`);
    });

    for (let i = 0; i < qNumCards; i++){
      let aLI;
      if (qAnswr[i]) {
        aLI = $("<div class='cardHolder'>"+
          "<div class='card'>"+
            "<div class='front'><span class='DBG'>"+(i+1)+"</span></div>"+
            "<div class='back DBG'><span>"+qAnswr[i][0]+"</span><b class='LBG'>"+qAnswr[i][1]+"</b></div>"+
          "</div></div>");
      } else {
        aLI = $("<div class='cardHolder empty'><div></div></div>");
      }
      let parentDiv = (i < qNumCards/2) ? col1 : col2;
      parentDiv.append(aLI);
    }

    let cardHolders = app.board.find('.cardHolder');
    let cards = app.board.find('.card');
    let backs = app.board.find('.back');
    let cardSides = app.board.find('.card>div');

    TweenLite.set(cardHolders, {perspective:800});
    TweenLite.set(cards, {transformStyle:"preserve-3d"});
    TweenLite.set(backs, {rotationX:180});
    TweenLite.set(cardSides, {backfaceVisibility:"hidden"});

    cards.data("flipped", false);

    function showCard(){
      let card = $('.card', this);
      let flipped = card.data("flipped");
      let cardRotate = flipped ? 0 : -180;

      flipSound.currentTime = 0;
      flipSound.play();

      TweenLite.to(card, 1, {rotationX: cardRotate, ease:Back.easeOut});
      card.data("flipped", !flipped);
      app.getBoardScore();
    }

    cardHolders.on('click', showCard);
  },

  getBoardScore: function(){
    let cards = app.board.find('.card');
    let boardScore = app.board.find('#boardScore');
    let currentScore = {var: parseInt(boardScore.html())};
    let score = 0;

    cards.each(function(){
      if($(this).data("flipped")){
        let value = $(this).find("b").html();
        score += parseInt(value);
      }
    });

    TweenMax.to(currentScore, 1, {
      var: score,
      onUpdate: function () {
        boardScore.html(Math.round(currentScore.var));
      },
      ease: Power3.easeOut
    });
  },

  awardPoints: function(){
    let num = $(this).attr("data-team");
    let boardScore = app.board.find('#boardScore');
    let currentScore = {var: parseInt(boardScore.html())};
    let team = app.board.find("#team"+num);
    let teamScore = {var: parseInt(team.html())};
    let updated = teamScore.var + currentScore.var;

    awardSound.currentTime = 0;
    awardSound.play();

    TweenMax.to(teamScore, 3.7, {
      var: updated,
      onUpdate: function () {
        team.html(Math.round(teamScore.var));
      },
      ease: Power3.easeOut
    });

    TweenMax.to(currentScore, 3.7, {
      var: 0,
      onUpdate: function () {
        boardScore.html(Math.round(currentScore.var));
      },
      ease: Power3.easeOut
    });
  },

  addError: function(){
    if (app.errorsLeft >= 3) return;

    app.errorsLeft++;
    app.board.find('#errorCount').html("❌".repeat(app.errorsLeft));

    wrongSound.currentTime = 0;
    wrongSound.play();

    if (app.errorsLeft === 3) {
      failSound.currentTime = 0;
      failSound.play();
    }
  },

  changeQuestion: function(){
    app.currentQ++;
    if (app.currentQ >= app.questions.length) app.currentQ = 0;
    app.makeQuestion(app.currentQ);
  },

  init: function(){
    $.getJSON(app.jsonFile, app.jsonLoaded);
    app.board.find('#newQuestion').on('click', app.changeQuestion);
    app.board.find('#awardTeam1').on('click', app.awardPoints);
    app.board.find('#awardTeam2').on('click', app.awardPoints);
    app.board.find('#addError').on('click', app.addError);
  }
};

app.init();
