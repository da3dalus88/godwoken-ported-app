const godwokenRpcUrl = 'https://godwoken-testnet-web3-rpc.ckbapp.dev'
const providerConfig = {
      rollupTypeHash: '0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a',
      ethAccountLockCodeHash: '0xdeec13a7b8e100579541384ccaf4b5223733e4a5483c3aec95ddc4c1d5ea5b22',
      web3Url:  godwokenRpcUrl
    }
const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig)
const DEFAULT_SEND_OPTIONS = {
	    gas: 6000000
};

App = {
    loading: false,
    contracts: {},
    load: async () => {
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContract()
        await App.render()
        await App.balance()
    },

  loadWeb3: async () => {
    App.web3Provider = provider
    web3 = new Web3(provider)
  },
  loadAccount: async () => {
    const accounts = await window.ethereum.request({
			method: 'eth_requestAccounts'
		})
		App.account = accounts[0]
  },
  loadContract: async () => {
     try {
			const todoContractAddr = '0xd0e2951371fB60C242Ef66Fcd63D7ff9e7A8d502'

			const todoList = await $.getJSON('TodoList.json')
			App.contracts.todoList = new web3.eth.Contract(todoList.abi, todoContractAddr)
		} catch (error) {
			console.error(error)
		}
  },
  render: async () => {
      // Prevent double render
    if (App.loading) {
      return
    }

    // Update app loading state
    App.setLoading(true)

    // Render Account
    $('#account').html(App.account)

    // Render Tasks
    await App.renderTasks()

    // Update loading state
    App.setLoading(false)
  },
  renderTasks: async () => {
    // Load the total task count from the blockchain
    const taskCount = await App.contracts.todoList.methods.taskCount().call({
	    ...DEFAULT_SEND_OPTIONS,
	    from: App.account
		})

    const $taskTemplate = $('.taskTemplate')

    // Render out each task with a new task template
    for (var i = 1; i <= taskCount; i++) {
      // Fetch the task data from the blockchain
      const task = await App.contracts.todoList.methods.tasks(i).call({
	...DEFAULT_SEND_OPTIONS,
	from: App.account
      })

      console.log(task)
      const taskId = Number(task[0])
      const taskContent = task[1]
      const taskCompleted = task[2]

      // Create the html for the task
      const $newTaskTemplate = $taskTemplate.clone()
      $newTaskTemplate.find('.content').html(taskContent)
      $newTaskTemplate.find('input')
                      .prop('name', taskId)
                      .prop('checked', taskCompleted)
                      .on('click', App.toggleCompleted)

      // Put the task in the correct list
      if (taskCompleted) {
        $('#completedTaskList').append($newTaskTemplate)
      } else {
        $('#taskList').append($newTaskTemplate)
      }

      // Show the task
      $newTaskTemplate.show()
    }
  },
  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  },
  createTask: async () => {
    App.setLoading(true)

    const content = $('#newTask').val()

    await App.contracts.todoList.methods.createTask(content).send({
	...DEFAULT_SEND_OPTIONS,
	from: App.account
    })

    window.location.reload()
  },
  toggleCompleted: async (e) => {
    App.setLoading(true)

    const taskId = e.target.name

    await App.contracts.todoList.methods.toggleCompleted(taskId).send({
	...DEFAULT_SEND_OPTIONS,
	from: App.account
    })

    window.location.reload()
  },
  balance: async () => {
		const addressTranslator = new AddressTranslator()
		const polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(App.account)
    
    console.log(App.account, polyjuiceAddress)

    $('#eth-address').text(App.account)
    $('#poly-address').text(polyjuiceAddress)
	}
}

$(() => {
    $(window).load(() => {
        App.load()
    })
})
