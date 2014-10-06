class window.VideoUploader
  constructor: (options={})->
    @options = options

    @options.fileUploadButtonId     or= "file-upload-button"
    @options.buttonContainerId      or= "upload-button-container"
    @options.uploadMainPanelId      or= "upload-main-panel"
    @options.onSuccessfulFileUpload or= (file, video)->
    @options.onFailedFileUpload     or= (file, response)->
    @options.onUploadProgress       or= (up, file)->
    @options.onSelect               or= (file)->
    @options.onUploadCancelled      or= (row)->

    @fileUploadButton       = $("##{@options.fileUploadButtonId}")
    @mainUploadPanel        = $("##{@options.uploadMainPanelId}")
    @uploadTokenAndEndpoint = {token: @fileUploadButton.attr("data-token"), endpoint: @fileUploadButton.attr("data-endpoint")}
    @getUploadTokenAndEndpointForNextRequest() unless @uploadTokenAndEndpoint.token
    @setupEvents()
    @initializeFileUpload()

    @tornDown = false
    @disabled = false

  setupEvents: ->
    @mainUploadPanel.bind 'dragover', =>
      @mainUploadPanel.addClass('dragover')
    @mainUploadPanel.bind 'dragleave drop', =>
      @mainUploadPanel.removeClass('dragover')

  initializeFileUpload: ->
    runtimes = 'html5,flash'
    @plupload = new plupload.Uploader
      runtimes : runtimes
      browse_button : @options.fileUploadButtonId
      container: @options.buttonContainerId
      #url: @uploadTokenAndEndpoint.endpoint
      url: 'http://temp'
      flash_swf_url: @fileUploadButton.data('swf-url')
      multipart: true
      multipart_params : {}
      drop_element: @options.uploadMainPanelId


    @plupload.init()

    @plupload.bind 'FilesAdded', (up, files)=>
      $.each files.reverse(), (i, file)=>
        # Do not allow uploads if disabled
        if @disabled
          @plupload.removeFile(file)
          return

        @options.onSelect(file)
      @plupload.start() if @uploadTokenAndEndpoint


    @plupload.bind 'BeforeUpload', (up, file)=>
      up.settings.url = @uploadTokenAndEndpoint.endpoint
      $.extend(up.settings.multipart_params, {uploadtoken: @uploadTokenAndEndpoint.token})
      @uploadTokenAndEndpoint = undefined
      @getUploadTokenAndEndpointForNextRequest()


    @plupload.bind 'UploadProgress', (up, file)=>
      @options.onUploadProgress(up, file)

    @plupload.bind 'FileUploaded', (up, file, responseObj)=>
      responseJson = JSON.parse(responseObj.response)

      if responseJson.video
        @options.onSuccessfulFileUpload(file, responseJson.video)
      else
        @options.onFailedFileUpload(file, responseJson)

      @runNextUpload()


  runNextUpload: ->
    # Stop the uploader and make sure we have another token ready and then start again
    @plupload.stop()
    @getUploadTokenAndEndpoint (details)=>
      @plupload.start()


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
