const Sauce = require('../models/sauce')

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({error}))
}

exports.getOneSauce = (req,res, next) => {
    Sauce.findOne({_id : req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({error}))
}

exports.addSauce = (req, res, next) => {
    delete req.body._id

    const sauce = new Sauce({
        ...req.body,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: [],
        userId: req.auth.userId
    })

    sauce.save()
        .then(() => {
            res.status(201).json({message: "Sauce ajoutée."})
        })
        .catch(error => res.status(400).json({error}))
}

exports.editSauce = (req, res, next) => {
    console.log(req)
    Sauce.findOne({_id: req.params.id})
        .then(sauce => {
            //Check if sauce exists
            if(!sauce) {
                return res.status(404).json({message: 'Sauce introuvable'})
            }

            //Check is current user added the sauce
            if(sauce.userId !== req.auth.userId) {
                return res.status(403).json({message: "Unauthorized"})
            }


            Sauce.updateOne({_id: req.params.id}, {...req.body, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Sauce modifiée avec succès !'}))
                .catch(error => res.status(400).json({error: error.message}))
        })
        .catch(error => res.status(400).json({error}))


}

exports.deleteSauce = (req, res, next) => {

    Sauce.findOne({_id: req.params.id})
        .then(sauce => {
            //Check if sauce exists
            if(!sauce) {
                return res.status(404).json({message: 'Sauce introuvable'})
            }

            //Check is current user added the sauce
            if(sauce.userId !== req.auth.userId) {
                return res.status(403).json({message: "Unauthorized"})
            }

            Sauce.deleteOne({_id: req.params.id})
                .then(() => res.status(200).json({ message: 'Sauce modifiée avec succès !'}))
                .catch(error => res.status(400).json({error: error.message}))
        })
}