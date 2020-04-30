var key = "RGAPI-c56e233b-4a58-4a67-89b6-54a607b50376";// 24 hour key
var name;
var sumID;
var accID;
var online = true;
var wins = 0;
var loss = 0;
var reg;

chrome.storage.sync.get('name', function (data) {
  name = data.name;
  chrome.storage.sync.get('reg', function (data) {
    reg = data.reg;
    get();
  })
});


function getData(link, callback) {
  var data;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", link, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      data = JSON.parse(xhr.responseText);
      callback(data);
    }
  }
  xhr.send();

}

function get() {
  url = "https://" + reg + ".api.riotgames.com/lol/summoner/v4/summoners/by-name/" + name + "?api_key=" + key;
  var optionsUrl = chrome.extension.getURL("/options.html");
  var content = '<a href="' + optionsUrl + '" target="_blank"><img id = "sum" src="img/icon.png" alt="change summoners" width= "15px" height= "15px" ></a>'
  document.getElementById("link").innerHTML = content;

  getData(url, function (data) {
    sumID = data.id;
    accID = data.accountId;
    name = data.name;
    if(data.status && data.status.status_code == 404) {
      document.getElementById("name").innerHTML = "Player not found";
      return;
    }
    document.getElementById("name").innerHTML = name;

    getActive();
    getRank();
  });


}//get

function getRank() {
  url = "https://" + reg + ".api.riotgames.com/lol/league/v4/entries/by-summoner/" + sumID + "?api_key=" + key;
  getData(url, function (data) {

    if (JSON.stringify(data) == "[]") {
      document.getElementById("tier").innerHTML = "<br>Unranked";
      document.getElementById("tier").style.margin = "auto";
    } else {
      document.getElementById("tier").style.backgroundImage = "url('img/" + data[0].tier + ".png')";
      var rank = data[0].tier.toLowerCase();
      rank = rank.charAt(0).toUpperCase() + data[0].tier.toLowerCase().slice(1);
      document.getElementById("rank").innerHTML = rank + " " + data[0].rank;
    }

  });
}

function getActive() {
  url = "https://" + reg + ".api.riotgames.com/lol/spectator/v4/active-games/by-summoner/" + sumID + "?api_key=" + key;
  getData(url, function (data) {
    var element = document.getElementById("status");
    var element2 = document.getElementById("timeTitle");

    //set player status
    if (data.status && data.status.status_code == 404) {
      online = false;
      element.classList.add("offline");
      element2.innerHTML = "Last Game Played";
    } else if (data.status) {
      online = false;
      element.classList.add("offline");
      element.innerHTML = "Player not found";
      element2.innerHTML = "";
      return;
    } else {
      online = true;
      element.classList.add("live");
      element2.innerHTML = "Current Game";
      
      //champ
      for (var i = 0; data.participants !== undefined && i < data.participants.length; i++) {
        if (data.participants[i].summonerName == name) {
          var champ = data.participants[i].championId;
          document.getElementById("champ").innerHTML = data.participants[i].championId;
          champPhoto(champ);
          break;
        }
      }
      //type
      var type = gameMode(data.gameQueueConfigId)
      document.getElementById("role").innerHTML = type;

      var secs = data.gameStartTime;
      secs = Date.now() - secs;
      secs = Math.floor(secs / 1000);
      var min = Math.floor(secs / 60);
      secs = secs - (min * 60);
      document.getElementById("kda").innerHTML = min + " : " + secs;

      if (min > 120) {
        min = 0;
        sec = 0;
        document.getElementById("time").innerHTML = "GAME STARTING";
        document.getElementById("kda").classList.add("hidden");
      } else {

        setInterval(function () {
          var a = "";
          secs += 1;
          if (secs > 60) {
            min += 1;
            secs = 0;
          }
          if (secs < 10) {
            a = "0";
          }
          document.getElementById("kda").innerHTML = min + " : " + a + secs;
        }, 1000);
      }
    }//else

    if (!online) {
      getTime();
    }
    getMatch();

  });

}//get Active



//get win:loss rate
function getMatch() {

  //getbegintime
  var d = new Date();
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  var begin = d.valueOf();
  d = new Date();
  var end = d.valueOf();


  url = "https://" + reg + ".api.riotgames.com/lol/match/v4/matchlists/by-account/" + accID + "?beginTime=" + begin + "&endTime=" + end + "&queue=420&api_key=" + key;
  getData(url, function (data) {
    for (var i = 0; data.matches !== undefined && i < data.matches.length; i++) {
      getGame(data.matches[i].gameId);
    }//for
  });
}//getMatch

//did they win or lose this game?
function getGame(match) {

  url = "https://" + reg + ".api.riotgames.com/lol/match/v4/matches/" + match + "?api_key=" + key;
  getData(url, function (data) {
    //identity dto, check name, grab id

    var id;
    for (var i = 0; data.participantIdentities !== undefined && i < data.participantIdentities.length; i++) {
      if (data.participantIdentities[i].player.summonerName == name) {
        id = data.participantIdentities[i].participantId;

        //participent dto,  participent stats
        for (var k = 0; data.participants !== undefined && k < data.participants.length; k++) {
          if (data.participants[k].participantId == id) {
            if (data.participants[k].stats.win) {
              wins++;
            } else {
              loss++;
            }
          }
        }
      }
    }

    document.getElementById("score").innerHTML = wins + " : " + loss;
  });

}//get

//display last game played
function getTime() {
  url = "https://" + reg + ".api.riotgames.com/lol/match/v4/matchlists/by-account/" + accID + "?api_key=" + key;
  getData(url, function (data) {

    //display last game played
    var match = data.matches[0].gameId;
    var champ = data.matches[0].champion;
    var type = data.matches[0].queue;
   
    document.getElementById("role").innerHTML = gameMode(type);
    document.getElementById("champ").innerHTML = champ;
    champPhoto(champ);

    url = "https://" + reg + ".api.riotgames.com/lol/match/v4/matches/" + match + "?api_key=" + key;
    getData(url, function (data2) {
      var len = data2.gameDuration;
      var start = data.matches[0].timestamp;
      var d = new Date();
      d.setTime(start + (len * 1000));
      document.getElementById("time").innerHTML = d.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' }) + "<br>" + d.toLocaleDateString();

      //find kda
      var id;

      for (var i = 0; data2.participantIdentities !== undefined && i < data2.participantIdentities.length; i++) {
        if (data2.participantIdentities[i].player.summonerName == name) {
          id = data2.participantIdentities[i].participantId;
          break;
        }
      }
      //participent dto,  participent stats
      for (var k = 0; data2.participants !== undefined && k < data2.participants.length; k++) {

        if (data2.participants[k].participantId == id) {
          var kills = data2.participants[k].stats.kills;
          var ass = data2.participants[k].stats.assists;
          var deaths = data2.participants[k].stats.deaths;
          document.getElementById("kda").innerHTML = kills + "/" + deaths + "/" + ass;
          break;
        }
      }
    });
  });
}//get match

function champPhoto(champ) {
  url = "http://ddragon.leagueoflegends.com/cdn/6.24.1/data/en_US/champion.json";

  getData(url, function (data) {
    data = data.data;

    for (var cname in data) {
      if (data[cname].key == champ) {
        champ = cname;
        break;
      }
    }
    url = "http://ddragon.leagueoflegends.com/cdn/6.24.1/img/champion/" + champ + ".png"
    var tag = "<img id = 'icon' src='" + url + "' alt='" + champ + "' >"
    document.getElementById("champ").innerHTML = tag;
  });

}

function gameMode(num){   
  //needs refactoring

switch(num) {
  case 0:
    return "Custom games";
  case 72:
    return "1v1 Snowdown";
    case 73:
    return "2v2 Snowdown";
    case 75:
    return "6v6 Hexakill";
    case 76:
    return "Ultra Rapid Fire";
    case 78:
    return "One For All"; 
    case 83:
    return "Co-op vs AI";
    case 98:
    return "6v6 Hexakill";
    case 100:
    return "ARAM";
    case 310:
    return "Nemesis";
    case 313:
    return "Black Market";
    case 317:
    return "Definitely Not Dominion";
    case 400:
    return "Draft Pick";
    case 420:
    return "Ranked Solo";
    case 430:
    return "Blind Pick";
    case 440:
    return "Ranked Flex";
    case 450:
    return "ARAM";
    case 460:
    return "3v3 Blind Pick ";
    case 470:
    return "3v3 Ranked Flex";
    case 600:
    return "Blood Hunt";
    case 610:
    return "Dark Star";
    case 700:
    return "Clash games";
    case 800:
    return "Co-op vs. AI";
    case 810:
    return "Co-op vs. AI";
    case 820:
    return "Co-op vs. AI";
    case 830:
    return "Co-op vs. AI";
    case 840:
    return "Co-op vs. AI";
    case 850:
    return "Co-op vs. AI";
    case 900:
    return "ARURF";
    case 910:
    return "Ascension";
    case 920:
    return "Poro King";
    case 940:
    return "Nexus Siege";
    case 950:
    return "Doom Bots Voting";
    case 960:
    return "Doom Bots Standard";
    case 980:
    return "Star Guardian Invasion";
    case 990:
    return "Star Guardian Invasion";
    case 1000:
    return "PROJECT: Hunters";
    case 1010:
    return "Snow ARURF";
    case 1020:
    return "One for All";
    case 1030:
    return "Odyssey Extraction";
    case 1040:
    return "Odyssey Extraction";
    case 1050:
    return "Odyssey Extraction";
    case 1060:
    return "Odyssey Extraction";
    case 1070:
    return "Odyssey Extraction";
    case 1200:
    return "Nexus Blitz";
  default:
    return "Unknown";
}
}
