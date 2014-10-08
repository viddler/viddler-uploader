class window.ViddlerVideoUploader
  constructor: (options={})->
    @options = options

    @options.fileUploadButtonId     or= "file-upload-button"
    @options.buttonContainerId      or= "upload-button-container"
    @options.dragDropPanelId        or= "drag-drop-panel"

    @options.postParams             or= {}
    @options.runtimes               or= "html5"
    @options.autostart              ?= true
    @options.multi_selection        ?= true

    @fileUploadButton       = $("##{@options.fileUploadButtonId}")
    @dragDropPanel          = $("##{@options.dragDropPanelId}")
    @uploadTokenAndEndpoint = {token: @fileUploadButton.attr("data-token"), endpoint: @fileUploadButton.attr("data-endpoint")}
    @getUploadTokenAndEndpointForNextRequest() unless @uploadTokenAndEndpoint.token
    @setupEvents()
    @initializeFileUpload()

    @tornDown = false
    @disabled = false
    @eventHandlers = {}

  setupEvents: ->
    @dragDropPanel.bind 'dragover', =>
      @dragDropPanel.addClass('dragover')
    @dragDropPanel.bind 'dragleave drop', =>
      @dragDropPanel.removeClass('dragover')

  initializeFileUpload: ->
    @plupload = new plupload.Uploader
      runtimes : @options.runtimes
      browse_button : @options.fileUploadButtonId
      container: @options.buttonContainerId
      #url: @uploadTokenAndEndpoint.endpoint
      url: 'http://temp'
      flash_swf_url: @options.flashSwfUrl
      multipart: true
      multipart_params : @options.postParams
      drop_element: @options.dragDropPanelId
      multi_selection: @options.multi_selection


    @plupload.init()

    @plupload.bind 'FilesAdded', (up, files)=>
      $.each files.reverse(), (i, file)=>
        # Do not allow uploads if disabled
        if @disabled
          @plupload.removeFile(file)
          return

        @trigger('select', [file])
      @start() if @options.autostart && @uploadTokenAndEndpoint


    @plupload.bind 'BeforeUpload', (up, file)=>
      up.settings.url = @uploadTokenAndEndpoint.endpoint
      $.extend(up.settings.multipart_params, {uploadtoken: @uploadTokenAndEndpoint.token})
      @uploadTokenAndEndpoint = undefined
      @getUploadTokenAndEndpointForNextRequest()


    @plupload.bind 'UploadProgress', (up, file)=>
      @trigger('uploadProgress', [up, file])

    @plupload.bind 'FileUploaded', (up, file, responseObj)=>
      responseJson = JSON.parse(responseObj.response)

      if responseJson.video
        @trigger('successfulFileUpload', [file, responseJson.video])
      else
        @trigger('failedFileUpload', [file, responseJson])

  getFreshUploadTokenAndEndpoint: (callback)->
    url = "#{@options.apiEndPoint}?action=prepareUpload&nocache=#{Math.random()}"
    $.getJSON url, (details)=>
      @uploadTokenAndEndpoint = details.upload
      callback(details)

  # Gets a token the fastest way possible (either a variable we stored earlier, else a fresh one.
  # Then call the callback with the token
  getUploadTokenAndEndpoint: (callback)->
    if @uploadTokenAndEndpoint && @uploadTokenAndEndpoint.token
      callback(@uploadTokenAndEndpoint)
    else
      @getFreshUploadTokenAndEndpoint(callback)

  getUploadTokenAndEndpointForNextRequest: ->
    return if @gettingSpareToken
    @gettingSpareToken = true
    @getFreshUploadTokenAndEndpoint (details)=>
      @gettingSpareToken = false

  disableUploadButton: ->
    @disabled = true
    @fileUploadButton.addClass('disabled')

  reEnableUploadButton: ->
    @disabled = false
    @fileUploadButton.removeClass('disabled')

  # Cancel any existing uploads, stop any recurring processes
  tearDown: ->
    @plupload.destroy()

  # Register an event callback
  on: (eventName, callback)->
    @eventHandlers[eventName] ||= []
    @eventHandlers[eventName].push callback

  trigger: (eventName, params)->
    @eventHandlers[eventName] ||= []
    for callback in @eventHandlers[eventName]
      callback.apply(this, params)

  start: ->
    @plupload.start()

