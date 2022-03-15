const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function list(req, res) {
    const {dishId} = req.params
    res.json({ data: dishes.filter(dishId ? dish => dish.id == dishId : () => true) })
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body
                if (data[propertyName] && data[propertyName].length > 0) {
                        return next()
                    }
                    next({
                        status: 400,
                        message: `Dish must include a ${propertyName}`
                    })
        }
}

function priceBodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body
        if(!data[propertyName]) {
            return next({status: 400, message: `Dish must include a ${propertyName}`})
        } else if (data[propertyName] <=0 || !Number.isInteger(data[propertyName])) {
            return next({status: 400, message: "Dish must have a price that is an integer greater than 0"})
        }
        return next()
    }
}


function create(req, res) {
    const { data: {name, description, price, image_url} = {} } = req.body
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url
    }
    dishes.push(newDish)
    res.status(201).json({ data: newDish })
}

function dishExists(req, res, next) {
    const { dishId } = req.params
    const foundDish = dishes.find(dish => dish.id === dishId)
    if (foundDish) {
        res.locals.dish = foundDish
        return next()
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}`
    })
}

function read(req, res, next) {
    res.json({ data: res.locals.dish })
}

function update(req, res) {
    const dish = res.locals.dish
    const { data: { name, description, price, image_url } = {} } = req.body
    dish.name = name
    dish.description = description
    dish.price = price
    dish.image_url = image_url
    
    res.json({ data: dish })

}

function dataIdIsValid(req, res, next) {
    const {dishId} = req.params
    const {data: {id} = {}} = req.body
    if(id)
        {if (dishId !== id) {
            next({
                status: 400,
                message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
            })
        }
    } 
    next()
}
module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        priceBodyDataHas("price"),
        bodyDataHas("image_url"),
        create
    ],
    list,
    read: [dishExists, read],
    update: [dishExists, 
        bodyDataHas("name"),
        bodyDataHas("description"),
        priceBodyDataHas("price"),
        bodyDataHas("image_url"),
        dataIdIsValid,
        update]
}
