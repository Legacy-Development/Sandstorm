const Discord = require("discord.js");
const client = new Discord.Client();
const ytdl = require("ytdl-core");
const config = require("./config.json");
const db = require("megadb")
let warn_db = new db.crearDB("warns", "moderacion")
let logs_db = new db.crearDB("logs", "moderacion")
let prefix = config.prefix;



var queue = new Map();

client.on("ready", () => {
  console.log('Sandstorm está listo!');
  client.user.setPresence({
    status: "online",
    game:  {
    name: "Memes",
    type: "WATCHING"
    }
  })                           
          });

async function play(message, serverQueue) {
  const args = message.content.split(" ");
  const voiceChannel = message.member.voiceChannel;
  if(!voiceChannel) return message.reply("debes entrar a un canal de voz");
  const permission = voiceChannel.permissionsFor(message.client.user);
  if(!permission.has('CONNECT')||!permission.has("SPEAK")) {
    return message.channel.send("Necesito permisos para entrar al canal de voz") 
  }
  
  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url,
  };
  
  if(!serverQueue) {
    const queueConstruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };
    queue.set(message.guild.id, queueConstruct);
    
    queueConstruct.songs.push(song);
    
    try{
      var connection = await voiceChannel.join();
      queueConstruct.connection = connection;
      playSong(message.guilld, queueConstruct.songs[0]);
    } catch (err) {
      console.log(err);
    queue.delete(message.guild.id)
    return message.channel.send("ha ocurrido un error al reproducir:" + err);
  }
}else{
  serverQueue.songs(song);
  return message.channel.send('la canción **{$song.title}** se ha añadido a la lista');
 }
}

function playSong(guild, song) {
  const serverQueue = queue.get(guild.id);
  
  if(!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dipatcher = serverQueue.connection.playStram(ytdl(song.url))
  .on("end", () => {
      serverQueue.songs.shiift();
      playSong(guild, serverQueue.songs[0]);
  })
  .on("error", error => {
      console.log(error);
  })
  dipatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

    client.on("message", msg => {
        const args = msg.content.slice(prefix.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();


        const serverQueue = queue.get(msg.guild.id);
        if(!msg.guild) return;

        //COMANDOS UTILES:
  
        if(cmd == "ping") {
            let latencia = Math.floor(msg.client.ping);
            const embed = new Discord.RichEmbed()
            .setAuthor(`ping de ${msg.author.username}`)
            .setColor("RANDOM")
            .setTitle("Mira tu ping!")
            .setThumbnail(msg.author.displayAvatarURL)
            .addField("Pong!", ":ping_pong:" + latencia + "ms");
            msg.channel.send(embed)
        };

        if(cmd == "avatar") {
          let mencionado = msg.mentions.members.first() || msg.member;
          const embed = new Discord.RichEmbed()
          .setTitle(`Avatar pedido por: ${msg.author.username}`)
          .setFooter(`Avatar de: ${mencionado.user.username}`)
          .setColor("RANDOM")
          .setImage(mencionado.user.displayAvatarURL);
          msg.channel.send(embed);
        };
      
            if(cmd == "info") {
        const embed = new Discord.RichEmbed()
        .setThumbnail("https://cdn.discordapp.com/avatars/643200883164839970/dfc319170bb0af83e395d06dc02d158d.png")
        .setColor("RANDOM")
        .setTitle(`Información de Sandstorm`)
        .setDescription(`Esta es la información a detalle de Sandstorm`)
        .addField("Programadores:", "MλSΤΣΓGッ#4130, Blox#5019, Juanchole Uwu#0011")
        .addField("Diseño:", "Blox#5019")
        .addField("Licencia:", "Gnu Public License v3.0")
        .addField("Version del BOT:", "1.0.1")
        .addField("Servidor de origen:", "Legacy Development")
        .addField("Uso:", "Multiuso")
        .addField("Página del proyecto:", "https://github.com/Legacy-Development/Sandstorm")
        msg.channel.send(embed);
    }; 

        //COMANDOS DE MÚSICA:
      
        if(cmd == "play") {
            play(msg, serverQueue);
        };
        
        if(cmd == "stop") {
            let cz = msg.member.voiceChannel;
            
            if(!cz){ 
                msg.channel.send("Cómo me voy a salir de el canal de voz si no estoy en uno?");
            } else {
                msg.channel.send("**Saliendo del canal de voz :wave:**").then(() => {
                    cz.leave();
                }).catch(e => console.log(e));
            }
        }
        //COMANDOS MODERACIÓN
        if(cmd ==="warn"){
          
        };
        
        if(cmd === "ban") {
          const mencionado = msg.guild.member(msg.mentions.users.first() || msg.guild.members.get(args[0]));
          const razon = args.join(' ').slice(22);

          //CONDICIONES:

          if(!msg.member.hasPermission("KICK_MEMBERS")) return msg.reply("No tienes permisos para dar ban.");
          if(!mencionado) return msg.reply("Debes mencionar a la persona a banear")
          if(!razon) return msg.reply("Debes poner una razón de el baneo");
          if(!logs_db) return msg.reply("No veo ningun canal de logs");

          //FUNCIÓN
          const embed = new Discord.RichEmbed()
          .setTitle("**BAN**")
          .setColor("#FF8000")
          .addField("Usuario Baneado:", `${mencionado}`)
          .addField("Moderador responsable:", `${msg.author.username}`)
          .addField("Canal donde fue baneado", msg.channel)
          .addField("Fecha de el baneo", msg.createdAt)
          .addField("Razón", razon);

          msg.guild.member(mencionado).ban(razon);
          logs_db.send(embed)
          msg.channel.send(`El usuario ${mencionado.user.username} fue baneado por ${msg.author.username}`)
        };

        if(cmd === "kick") {
          
        };

        if(cmd === "mute") {
          
        };

        if(cmd ==="setmod"){
          
        };

    if(cmd === "setlogs"){
        if(!msg.member.hasPermission("ADMINISTRATOR")){
          msg.channel.send({embed: {
            color: 3447003,
            description: "Necesitas ser administrador del server para usar este comando!"
          }
      })
      }else{
        let canal = msg.mentions.channels.first() 
        let comprobar = msg.guild.channels.get(canal)
        if(!canal) return msg.channel.send("Necesitas mencionar un canal!")
        if(!comprobar){
          msg.channel.send({embed: {
            color: 3447003,
            description: "Necesitas mencionar un canal valido!"
          }
      });           
        }else{
            let canalid = canal.id
            let canalname = canal.name 
            msg.channel.send({embed: {
              color: 3447003,
              description: "Canal de logs modificado!\nNombre:"+canalname+"\nId:"+canalid
            }
        });  
            logs_db.establecer(`${msg.guild.id}`, canalid)
        }
        }
      };
    
        
        //COMANDOS DIVERTIDOS:
    
      
        if(cmd == "di") {
          let decir = args.join(' ');

          //CONDICIONES
          if(!decir) return msg.reply("Que quieres que repita?")
          if(!msg.author.hasPermission("MENTION_EVERYONE")) return msg.reply("No puedes hacerme mencionar a todos.")
          
          //FUNCIÓN
          msg.delete()
          msg.channel.send(decir)
        };
      
       if(cmd == "hola") {
    let mencionado = msg.mentions.members.first();
    if(!mencionado) return msg.reply("Debes mencionar a quien quieras saludar...")
    img = 10;
    var random = Math.floor(Math.random() * (img - 1 + 1)) + 1;
    const embed = new Discord.RichEmbed()
    switch(random) {
        case 1: embed.setImage("https://i.pinimg.com/originals/3c/52/cc/3c52cc0620b94eb9b33a490f49da75e3.gif"); break;
        case 2: embed.setImage("https://media1.tenor.com/images/724779b81b78b4a3cfc90cd6fd73cbd4/tenor.gif?itemid=4983892"); break;
        case 3: embed.setImage("http://4.bp.blogspot.com/-gFgQSsMJARQ/U4VFdzIwJoI/AAAAAAAAFjs/L3xAvtRqZEM/s1600/tumblr_mcdbxuPTzd1rdiylyo2_500_large.gif"); break;
        case 4: embed.setImage("https://media1.tenor.com/images/972424767943ed34a19f6ff2a9cbe976/tenor.gif?itemid=14192312"); break;
        case 5: embed.setImage("https://media.tenor.com/images/4b9b18c7aae49b108354a22a0cb615fc/tenor.gif"); break;
        case 6: embed.setImage("https://media1.tenor.com/images/d5e6472ab9473913382e82ecc298f1a2/tenor.gif?itemid=9810622"); break;
        case 7: embed.setImage("https://thumbs.gfycat.com/LikableYellowGander-size_restricted.gif"); break;
        case 8: embed.setImage("https://image.myanimelist.net/ui/bfln5jRa_L37ziNWm-xNvI4YaXyM-FtsJYRA6MVQ3YPuv0RmNz-l604CAei6GAjxbVrVU7NvAlz741Qf1hQX4neRoekLumYPHh2KIatCJ1Y"); break;
        case 9: embed.setImage("https://i.imgur.com/2CrEDAD.gif"); break;
        case 10: embed.setImage("https://media1.tenor.com/images/943a3f95936d66dc0c78fd445893431e/tenor.gif?itemid=9060940"); break;
    }
    embed.setColor("RANDOM")
    embed.setDescription(`**${msg.author.username}** ha saludado a **${mencionado.user.username}** owo`)
    msg.channel.send(embed);
    }
      
      if(cmd == "shitpost") {
      img = 5;
        var random = Math.floor(Math.random() * (img - 1 + 1)) + 1;
        const embed = new Discord.RichEmbed()
        switch(random) {
          case 1: embed.setImage("https://k62.kn3.net/taringa/7/1/3/9/2/8/Shitpost/550x894_C02.jpg"); break;
          case 2: embed.setImage("https://pm1.narvii.com/7279/829da0d1e364841c5c9ccfdf41dd8ff1cb77f717r1-500-347v2_hq.jpg"); break;
          case 3: embed.setImage("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq1y9zrPCp-ufVdQb6TbyjPTyb0ZBzPjf97RDHHCxCUq34lbad&s"); break;
          case 4: embed.setImage("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRF51Hc9sVdUPOhbrh4ZO4Z9M8pgBor6S6ZPoe2uP12986nKUfC&s"); break;
          case 5: embed.setImage("https://pm1.narvii.com/7249/0e25b8522acc462e8f412fe4d0d7bf2d36ffa508r1-925-1280v2_hq.jpg"); break;
        }
        embed.setColor("RANDOM")
        embed.setDescription(`Una imagen tipo shitpost ._.XD`)
        msg.channel.send(embed);
      }
      
      if(cmd == "phonewall") {
        img = 10;
        var random = Math.floor(Math.random() * (img - 1 + 1)) + 1;
        const embed = new Discord.RichEmbed()
        switch(random) {
            case 1: embed.setImage("https://fsb.zobj.net/crop.php?r=66JRAttlDihQpTMMGqljTBRSFpKdlBGPg2NDAbyae5gA5q8sh2FMT-h2-iTaUmhyxDzbPMs15t8uGkVkpGeux0Gz5ln90nr7CBBrCbT6v9JWBeH-p-IOxTfI0zT46YJ4BOQK5D6n3xlmTrNvmgA0AupaAJq_cSwL32uHVxllD27Nr9VLYlHBlM575es"); break;
            case 2: embed.setImage("http://getwallpapers.com/wallpaper/full/2/a/d/1334896-hipster-phone-wallpapers-1080x1920-retina.jpg"); break;
            case 3: embed.setImage("https://wallpaperaccess.com/full/8575.jpg"); break;
            case 4: embed.setImage("https://i.redd.it/2wft1860ztb11.jpg"); break;
            case 5: embed.setImage("https://preview.redd.it/u1edwcfniec21.png?auto=webp&s=a31ac567c329b60c34b7fb9d699780ebf6ef8a52"); break;
            case 6: embed.setImage("https://images-cdn.9gag.com/photo/anMdx75_460s.jpg"); break;
            case 7: embed.setImage("https://www.larutadelsorigens.cat/filelook/full/21/216722/phone-wallpapers-for-guys.jpg"); break;
            case 8: embed.setImage("http://school298.spb.ru/images/100/DSC100137285.jpg"); break;
            case 9: embed.setImage("https://i.pinimg.com/236x/a9/5b/4a/a95b4a2eb62b96404bc076786fedac48.jpg"); break;
            case 10: embed.setImage("https://i.pinimg.com/236x/a5/96/d8/a596d89f9d9d5b0abdb7c064bfafbc35.jpg"); break;
        }
        embed.setColor("RANDOM")
        embed.setDescription(`Un buen fondo de pantalla para tu telefono celular`)
        msg.channel.send(embed);
      }
        if(cmd == "8ball") {
          let pregunta = args.join(' ');
          respuestas = 10;
          let randomR = Math.floor(Math.random() * (respuestas + 1 - 1)) + 1;

          //CONDICIONES:
          
          if(!pregunta) return msg.reply("Debes preguntarme algo!")

          //FUNCIÓN:

          const embed = new Discord.RichEmbed();
          embed.setTitle(`Preguntas!`)
          embed.addField("Pregunta", `${pregunta}`)
          embed.setAuthor(`Pregunta de: ${msg.author.username}`, msg.author.displayAvatarURL)
          embed.setColor("RANDOM")
          switch(randomR) {
            case 1: embed.addField("Respuesta:", "Obvio") ; break;
            case 2: embed.addField("Respuesta:", "Probablemente") ; break;
            case 3: embed.addField("Respuesta:", "Claro que no") ; break;
            case 4: embed.addField("Respuesta:", "nOoOooOO") ; break;
            case 5: embed.addField("Respuesta:", "SI!") ; break;
            case 6: embed.addField("Respuesta:", "No lo se") ; break;
            case 7: embed.addField("Respuesta:", "Quizás") ; break;
            case 8: embed.addField("Respuesta:", "Probablemente si") ; break;
            case 9: embed.addField("Respuesta:", "Dime tú") ; break;
            case 10: embed.addField("Respuesta:", "Acaso la respuesta no es obvia?") ; break;
          };
          msg.channel.send(embed);
        }
    });


    client.login(config.token);
