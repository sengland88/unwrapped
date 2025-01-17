const fs = require('fs')
const PDFDocument = require('pdfkit');
const doc = new PDFDocument;

var db = require("../models");

module.exports = function(app) {
  app.get("/api/users", function(req, res) {
    db.User.findOne({
      where: {
        email: req.query.email,
        password: req.query.password
      }
    }).then(function(dbUsers) {
      if (dbUsers) {
        res.json({ name: dbUsers.firstName, userId: dbUsers.id });
      } else {
        res.json({ message: "failed" });
      }
    });
  });

  app.get("/api/rsvp/:partycode", function(req, res) {
    db.Party.findOne({
      where: {
        partyCode: req.params.partycode
      }
    }).then(function(dbParties) {
      if (dbParties) {
        res.json({
          partyId: dbParties.id,
          name: dbParties.name,
          occasion: dbParties.occasion,
          location: dbParties.location,
          date: dbParties.date,
          time: dbParties.time,
          organizer: dbParties.userId
        });
      } else {
        res.json({ message: "failed" });
      }
    });
  });

  app.get("/api/parties/:user", function(req, res) {
    let user = req.params.user;

    db.Party.findAll({
      where: {
        UserId: user
      }
    }).then(function(dbParties) {
      if (dbParties) {
        res.json({ dbParties });
      } else {
        res.json({ message: "You have no parties" });
      }
    });
  });

  app.get("/api/parties/update/:id", function(req, res) {
    let id = req.params.id;

    db.Party.findOne({
      where: {
        id: id
      }
    }).then(function(dbParty) {
      if (dbParty) {
        res.json({ dbParty });
      } else {
        res.json({ message: "Party not found" });
      }
    });
  });

  app.get("/api/users/update/:id", function(req, res) {
    let id = req.params.id;
    db.Rsvp.findOne({
      where: {
        id: id
      },
      include: [db.User]
    }).then(function(data) {
      res.json({ data });
    });
  });

  app.get("/api/rsvp/guests/:id", function(req, res) {
    let id = req.params.id;
    db.Rsvp.findAll({
      where: {
        PartyId: id
      },
      include: [db.User]
    }).then(function(dbParty) {
      if (dbParty) {
        res.json({ dbParty });

        //Export to PDF
        doc.pipe(fs.createWriteStream('public/output.pdf'));
        doc.image('public/imgs/unwrapped_pdf.jpg', {fit: [200, 200], align: 'center'})
            .moveDown(0.7);
        for (let i = 0; i < dbParty.length; i++) {
          let guest = dbParty[i].dataValues.User.dataValues
          let guestInfo = dbParty[i].dataValues
          let thankYou;
          if (guestInfo.thankYou) {
            thankYou = "Yes";
          } else thankYou = "No";
          doc.font('Times-Roman')
              .fontSize(16)
              .text(`Guest: ${guest.firstName}`);
          doc.fontSize(12)
              .list([`Email: ${guest.email}`, `Address: ${guest.address}`, `Gift: ${guestInfo.gift}`, `Thank you? ${thankYou}`])
              .moveDown(0.5);
        }
        doc.end();
        
      } else {
        res.json({ message: "No RSVP Yet" });
      }
    });
  });

  app.get("/api/myRsvps/:id", function(req, res) {
    let user = req.params.id;

    db.Rsvp.findAll({
      where: {
        UserId: user
      },
      include: [db.Party]
    }).then(function(dbRsvps) {
      if (dbRsvps) {
        res.json({ dbRsvps });
      } else {
        res.json({ message: "You have no RSVPs" });
      }
    });
  });
};
