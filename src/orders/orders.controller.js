const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
    const {orderId} = req.params
    res.json({ data: orders.filter(orderId ? order => order.id == orderId : () => true) })
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const {data={}} = req.body
    if(data[propertyName] && data[propertyName].length > 0) {
      return next()
    } 
    next({
      status: 400,
      message: `Order must include a ${propertyName}`
    })
  }
}

function create(req, res) {
    const {data: {deliverTo, mobileNumber, status, dishes} = {}} = req.body
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: dishes
    }
    orders.push(newOrder)
    res.status(201).json({data:newOrder})
}

function dishesMissingQuantity(req, res, next) {
    const {data:{dishes} = {}} = req.body
    for(let i = 0; i<dishes.length; i++) {
        if(!dishes[i].quantity || dishes[i].quantity <= 0 || !Number.isInteger(dishes[i].quantity)) {
            return next({status: 400, message: `Dish ${i} must have a quantity that is an integer greater than 0`})
        } 
    }
    return next()
}
function dishesIsValid(req, res, next) {
    const {data:{dishes} = {}} = req.body 
    if (!dishes) {
        return next({status: 400, message: "Order must include a dish"})
    } else if (!Array.isArray(dishes) || dishes.length === 0) {
        return next({status: 400, message: "Order must include at least one dish"})
    } 
    next()
}

function orderExists(req, res, next) {
    const { orderId } = req.params
    const foundOrder = orders.find(order => order.id === orderId)
    if(foundOrder) {
        res.locals.order = foundOrder
        return next()
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`
    })
}

function read(req, res, next) {
    res.json({ data: res.locals.order })
}

function update(req, res) {
    const order = res.locals.order
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
    order.deliverTo = deliverTo
    order.mobileNumber = mobileNumber
    order.status = status
    order.dishes = dishes
    res.json({ data: order })
}

function dataIdIsValid(req, res, next) {
    const {orderId} = req.params
    const {data: {id}} = req.body
    if(id) {
        if(orderId !== id) {
            next({
                status: 400,
                message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
            })
        }
    }
    next()
}

// function orderPending(req, res, next) {
//     const {data: {status}}
// }

function destroy(req, res, next) {
    const { orderId } = req.params
    const index = orders.findIndex((order) => order.id === orderId)
    const deletedOrders = orders.splice(index, 1)
    res.sendStatus(204)
}

function statusIsValid(req, res, next) {
    const {data: {status} = {}} = req.body
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"]
    if(validStatus.includes(status)) {
        return next()
    }
    next({
        status: 400, 
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
}

function validateDelete(req, res, next) {
    const { orderId } = req.params
    const index = orders.findIndex((order) => order.id === orderId)
    const status = orders[index].status
    if (status !== "pending") {
        return next({
            status: 400, message: "An order cannot be deleted unless it is pending"
        })
    }
    next()
}

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesIsValid,
        dishesMissingQuantity,
        create
    ],
    list,
    update:[
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataHas("status"),
        dishesIsValid,
        dishesMissingQuantity,
        orderExists, 
        dataIdIsValid,
        statusIsValid,
        update
    ],
    read: [orderExists, read],
    delete: [orderExists, validateDelete, destroy]
}