const TodoList = artifacts.require("TodoList.sol");

module.exports = function(deployer) {
  deployer.deploy(TodoList, {gas: 1000000});
};