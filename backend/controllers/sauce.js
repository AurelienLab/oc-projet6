const fs = require('fs')
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
    delete req.body.sauce._id

    const sauce = new Sauce({
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
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
    const sauceObject = req.file ? {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body }

    delete sauceObject.userId

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

            const imageName = sauce.imageUrl.split('/images/')[1]

            Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id })
                .then(() => {
                    if(req.file) { //Delete old file if new one updated
                        fs.unlink('images/' + imageName, () => {})
                    }
                    res.status(200).json({ message: 'Sauce modifiée avec succès !'})

                })
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
            const imageName = sauce.imageUrl.split('/images/')[1]
            fs.unlink('images/' + imageName, () => {
                Sauce.deleteOne({_id: req.params.id})
                    .then(() => res.status(200).json({ message: 'Sauce modifiée avec succès !'}))
                    .catch(error => res.status(400).json({error: error.message}))
            })
        })
        .catch(error => res.status(500).json({error}))
}

exports.likeSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauce => {
            let message = "La sauce "
            switch (req.body.like) {
                case -1: //User clicked on dislike
                    if(sauce.usersDisliked.includes(req.auth.userId)) { //If user already disliked, do nothing
                        const error = new Error('Already disliked')
                        return res.status(405).json({error : error.message});
                    }
                    sauce.usersLiked = sauce.usersLiked.filter(userId => userId !== req.auth.userId) //Remove user from liked array
                    sauce.usersDisliked.push(req.auth.userId) //Add user to disliked array
                    message += "a été dislikée"
                    break;
                case 0: //User canceled like or dislike
                    sauce.usersLiked = sauce.usersLiked.filter(userId => userId !== req.auth.userId) //Remove user from liked array
                    sauce.usersDisliked = sauce.usersDisliked.filter(userId => userId !== req.auth.userId) //Remove user from disliked array
                    message += "a perdu son like ou dislike"
                    break;
                case 1: //User clicked on like
                    if(sauce.usersLiked.includes(req.auth.userId))  { //If user already liked, do nothing
                        const error = new Error('Already liked')
                        return res.status(405).json({error : error.message});
                    }
                    sauce.usersDisliked = sauce.usersDisliked.filter(userId => userId !== req.auth.userId) //Remove user from liked array
                    sauce.usersLiked.push(req.auth.userId) //Add user to disliked array
                    message += "a été likée"
                    break;
                default:
                    return res.status(400).json(new Error('Bad request'))
            }

            //Calculate likes and dislikes
            sauce.likes = sauce.usersLiked.length
            sauce.dislikes = sauce.usersDisliked.length

            sauce.save()
                .then(() => res.status(200).json({message}))
                .catch(error => res.status(400).json({error}))

        })
        .catch(error => res.status(400).json({error}))
}