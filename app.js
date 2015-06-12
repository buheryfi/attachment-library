(function() {
    var self = this;
    var current_page = 0;
    var previous_page;
    var per_page = 9;
    var bestData;
    var navigation_html;
    var put_data;
    var current_text;
    var ratio;
    /*global Image:true*/

    return {
        events: {
            'app.activated':'initialize',
            'click .btn':'toggleButtonGroup',
            'click li.clickable':'add_colour', // add class to selected images

        // currently we can use the image element's attributes for display data, or
        // we could make a request to the API with the attachment ID (which we don't currently store), or
        // we could look at the bookmarks object/string that we store ont he user.
        // If we load it once and save it in app memory, then we could reference it from any other function
        // currently, I have to pull the data again with show_details, but would be easier to reference
        // an object that is global?
        
        // Show details might work best if using the stored object separately,
        // and on the Page tab it can reference the object created for the present ticket's attachments
        
        // This might also be better served by keeping an index in the objects, or id, and then simply grabbing the index on hover
        // and populating the relevant variable for display.
        // show more detailed information about a file when hovering over thumbnail

            'mouseover .more-info': function(e) {
              this.$(e.target).popover('show');
            },
            
            // Navigate paginated content with Next, Previous, or Direct Page Link
            'click .page_link': function(e) {
                current_page = parseInt(this.$(e.target).val(), 10);
                if (this.$('#get_library').hasClass('active')){
                    this.renderLibrary(current_page);
                } else if (this.$('#getImage').hasClass('active')) {
                    this.getImages(current_page);
                }
            },
            
            //working with images on page
            'click #getImage': 'getImages',  // switches template to get and shows all images on page as thumbnails in template
            'click #add_images' : 'addToLibrary', // add selected images to library
            'click #add_text' : 'addTextToLibrary',

            //working with images inside of library
            'click #get_library':'getLibrary', // switches template to library and show images from library
            'click #embed_images':'embedImages',
            'click #embed_link':'embedLinks',
            'click #remove_images':'removeImages',
            'click #preview_item': 'previewItem',

            // working with Remote Content
            'click #getExternal': 'getExternal',
            'click #addExternal': 'addExternalToLibrary',

            // Growler notifications for external requests
            'putField.done': function() {
                services.notify('Item(s) Successfully Added.');
            },
            'putField.fail': function() {
                services.notify('Item(s) could not be added.  Contact your administrator.');
            }
        },

        resources: {
        },

        requests: {

            putField: function(data) {
                return {
                    url: '/api/v2/users/'+self.user_id+'.json',
                    type: 'PUT',
                    dataType: 'json',
                    contentType: 'application/json; charset=UTF-8',
                    data: '{"user": {"user_fields":{"'+this.settings.field_key+'":"'+data+'"}}}',
                };
            },

            getField: function(data) {
                return {
                    url: '/api/v2/users/me.json',
                    type: 'GET',
                    dataType: 'json',
                };
            }
        },

        initialize: function() {
            self.user_id = this.currentUser().id();
        },

        getImages: function(current_image_page) {
            // load attachments from current page to allow interaction with them
            var att = [];


            // some thumbnails do not load on first page load, only on next page load. Why is that?
            if (typeof current_image_page !== "number"){
                current_image_page = 0;
            }
            
            this.ticket().comments().forEach(function(comment){
            // find all image and nonimage ticket attachments
                comment.nonImageAttachments().forEach(function(nonImage){
                    var object = {};
                    object.url = nonImage.contentUrl();
                    object.name = nonImage.filename();
                    object.type = "text";
                    att.push(object);
                });
                comment.imageAttachments().forEach(function(image){
                    var object = {};
                    object.url = image.contentUrl();
                    object.name = image.filename();
                    object.type = "image";
                    att.push(object);
                });
            // find inline images from ticket comments
                var str = comment.value();
                str = str.replace(/\s/g, '');
                var regex = str.match(/<img.+?src=[\"'](.+?)[\"'].*?>/gi);
                if (regex !== null) {                    
                    var url = regex[0].match(/src=[\"'](.+?)[\"']/gi);
                    url = url.substring(5, url.length - 1);     
                    var alt = regex[0].match(/alt=[\"'](.+?)[\"']/gi);
                    
                    if (alt !== null) {
                        alt = alt.substring(5, alt.length - 1);
                    } else { 
                        alt = "No Name";
                    }
                    var object = {};
                    object.url = url;
                    object.name = alt;
                    object.type = "image";
                    att.push(object);
                }
            });
            
            // if no images, show no images and break.
            if(att.length === 0) {
                this.switchTo("get", {imageList: "<li class=\"imgbox\"><br>No Attachments Found</li>"});
                return;
            }

            //  render attachments
            var number_of_items = att.length;
            var pager = this.paginate(att, current_image_page, number_of_items);
            
            var attachment;
            var attachmentList = "";
            var end_of_list = per_page*(current_image_page+1);
            var beg_of_list = per_page*current_image_page;
            if (end_of_list > number_of_items) {
                end_of_list = number_of_items;
            }
            for (var i = beg_of_list; i < end_of_list; i++){
                if (att[i] !== null){
                    if (att[i].type == "text"){
                        attachmentList += this.renderTemplate("imgbox",
                        {
                            type: att[i].type,
                            src: '',
                            alt: att[i].name,
                            height: 0,
                            width: 0,
                            top: 0,
                            left: 0,
                            data_url: att[i].url,
                            data_title: att[i].name,
                            data_content: att[i].url
                        });
                    } else if (att[i].type == "image"){
                        attachment = this.resizeImage(att[i].url);
                        console.log(attachment);
                        attachmentList += this.renderTemplate("imgbox",
                        {
                            type: att[i].type,
                            src: att[i].url,
                            alt: att[i].name,
                            height: attachment.height,
                            width: attachment.width,
                            top: (82-attachment.height)/2,
                            left: (82-attachment.width)/2,
                            data_url: att[i].url,
                            data_title: att[i].name,
                            data_content: att[i].url
                        });
                    }
                    else {return;}
                }
            }
            this.switchTo("get", {imageList: attachmentList, pager: pager});
        },

        getLibrary: function() {
            // load library page template
            // load data from user field and render thumbnails
            this.ajax('getField').done(function(data) {
                self.library = data.user.user_fields[this.settings.field_key];
                this.renderLibrary();
            });
        },
        
        paginate: function(array, current_page, number_of_items) {

            var number_of_pages = Math.ceil(number_of_items/per_page);
            
            if (current_page === 0) { 
                previous_page = 0;
                navigation_html = '<button type="button" class="page_link" disabled value="'+previous_page+'"><-</button>';
            } else {
                previous_page = current_page - 1;
                navigation_html = '<button type="button" class="page_link" value="'+previous_page+'"><-</button>';
            }
            
            for(var i = 0; i < number_of_pages; i++){
                if (i == current_page){
                    navigation_html += '<button type="button" class="page_link current" value="'+i+'">' + (i + 1) +'</button>';
                } else {
                    navigation_html += '<button type="button" class="page_link" value="'+i+'">' + (i + 1) +'</button>';
                }
            }
            
            if (current_page+1 >= number_of_pages) { 
                next_page = number_of_pages;
                navigation_html += '<button type="button" class="page_link" disabled value="'+next_page+'">-></button>';
            } else {
                var next_page = current_page + 1;
                navigation_html += '<button type="button" class="page_link" value="'+next_page+'">-></button>';
            }
            
            var pager = this.renderTemplate('pager', {
                page_navigation: navigation_html
            });
            
            return pager;
        },
        
        renderLibrary: function(current_page) {
            current_page = current_page || 0;

            if(self.library == null) {
                this.switchTo("library", {imageList: "<li class=\"imgbox\"><br>Nothing Here Yet!</li>"});
                return;
            }

            var res = self.library.split(";");
            var number_of_items = res.length-1;
            var pager = this.paginate(res, current_page, number_of_items);
            
            var img;
            var imageList = "";
            var end_of_list = per_page*(current_page+1);
            var beg_of_list = per_page*current_page;
            if (end_of_list > number_of_items) {end_of_list = number_of_items;}
            
            for (var i = beg_of_list; i < end_of_list; i++){
                if (res[i] !== null){
                    var attachment = res[i].split(",");
                    var imageObject = {};
                    if (attachment[2] == "image"){
                        imageObject = this.resizeImage(attachment[0]);
                        imageObject.alt = attachment[1];
                        imageObject.data_url = attachment[0];
                        imageObject.top = (82-imageObject.height)/2;
                        imageObject.left = (82-imageObject.width)/2;
                        imageObject.type = "image";
                    } else if (attachment[2] == "text") {
                        imageObject = new Image();
                        imageObject.src = '';
                        imageObject.height = 0;
                        imageObject.width = 0;
                        imageObject.alt = attachment[1];
                        imageObject.data_url = attachment[0];
                        imageObject.top = 0;
                        imageObject.left = 0;
                        imageObject.type = "text";
                    }
                    imageList += this.renderTemplate("imgbox",
                    {
                        alt: imageObject.alt,
                        src: imageObject.src,
                        height: imageObject.height,
                        width: imageObject.width,
                        top: imageObject.top,
                        left: imageObject.left,
                        data_url: imageObject.data_url,
                        type: imageObject.type,
                        data_title: imageObject.alt,
                        data_content: imageObject.data_url
                    });    
                }                
            }
            this.switchTo("library", {imageList: imageList, pager: pager});
        },

        resizeImage: function(object) {
            var img = new Image(82, 82);
            img.src = object;

                /*if(img.width > img.height) {
                    ratio = 82/img.width;
                } else {
                    ratio = 82/img.height;
                }
                img.height *= ratio;
                img.width *= ratio;*/
                return img;            
        },

        toggleButtonGroup: function(event) {
            if(this.$(event.target).parent().hasClass("btn-group")) {
                _.each(this.$(event.target).parent().children(),
                function(value) {
                    this.$(value).removeClass("active");
                });
                this.$(event.target).addClass("active");
            }
        },

        // Toggle Class for Selected Item - Disable Preview Button if Multiple Items Selected
        add_colour: function(event) {
            if(this.$(event.target).prop('tagName') == "IMG") {
                this.$(event.target).parent().parent().toggleClass("highlight");
            } else if(this.$(event.target).prop('tagName') == "DIV") {
                this.$(event.target).parent().toggleClass("highlight");
            } else {
                this.$(event.target).toggleClass("highlight");
            }
            var numItems = this.$(".highlight").length;
            if ( numItems > 1) {this.$("#preview_item").prop("disabled", true); }
            else if ( numItems <= 1) {this.$("#preview_item").prop("disabled", false); }
            this.$(".hidden").removeClass("hidden");
        },

        //add attachments to library, including URL, name, and type (txt or image)
        addToLibrary: function(data){
            var value = this.ajax('getField', data).done(function(data) {
                var put_data = '';
                this.$(".highlight").each(function(i, val) {
                    var alt = val.children[0].children[0].getAttribute("alt");
                    alt = alt.replace(/[,;]/g , ' ');
                    if (val.getAttribute("class").indexOf("image") !== -1 ) {
                        put_data += val.children[0].children[0].getAttribute("src")+',';
                        put_data += alt+',';
                        put_data += "image;";
                    }
                    else if (val.getAttribute("class").indexOf("doc")) {
                        put_data += val.children[0].children[0].getAttribute("data-contentURL")+',';
                        put_data += alt+',';
                        put_data += "text;";
                    }
                });
                var value = data.user.user_fields[this.settings.field_key];
                if (value !== null) { bestData = value+put_data;}
                else { bestData = put_data;}
                this.ajax('putField', bestData);
            });
        },

        // will remove the thumbnail URL from user field based on user selection
        // this does not work with new data model.
        // currently we are removing based on matching a URL string.
        // this needs to account for a different data structure, using the index
        removeImages: function(data){
            self.$(".highlight").each(function(i, val) {
                var string = val.children[0].children[0].getAttribute("data-contentURL")+';';
                self.library = self.library.replace(string, '');
            });
            this.ajax('putField', self.library).done(function(data) {
                self.library = data.user.user_fields[this.settings.field_key];
                this.renderLibrary();
            });
        },

        // will embed an image with Markdown into ticket based on user action
        embedImages: function(data){
            put_data = '';
            self.$(".highlight").each(function(i, val) {
                put_data += "![Image from Markdown]("+val.children[0].children[0].getAttribute("src")+") " + "\n";
            });
            current_text = this.comment().text();
            current_text += put_data;
            this.comment().text(current_text);
        },

        embedLinks: function(data){
            put_data = '';
            self.$(".highlight").each(function(i, val) {
                put_data += "["+val.children[0].children[0].getAttribute("alt")+"]("+val.children[0].children[0].getAttribute("data-contentURL")+")";
            });
            current_text = this.comment().text();
            current_text += put_data;
            this.comment().text(current_text);
        },

        // show preview of selected Text File using Google Docs API in a modal Iframe
        previewItem: function(data, target){
            //if image, use modal to show item, if doc, use google API
            // need to get this centered and change title for images to image preview rather than doc preview
            if (self.$(".highlight").hasClass('image')) {
                var url = self.$(".highlight > div > img").attr('data-contenturl');
            } else if (self.$(".highlight").hasClass('text')) {
                var log = self.$(".highlight > div > img").attr('data-contenturl');
                var url = "http://docs.google.com/viewer?url="+log+"&embedded=true";
            }
            this.$('#modalIframe').attr('src', url);
            this.$('#myModal').modal('show');
        },

        getExternal: function() {
            this.switchTo("external");
        },

        //  This allows the end-user to add images or files hosted externally to be stored
        //  inside of their library
        // how should we determine if this is image or text?
        // look at mime type, extension, or allow for user choice?
        // should we restrict which types of extensions can be added?
        // what is to stop him from uploading other types of files? OK?
        addExternalToLibrary: function() {
            var fileLocation = this.$("externalURL").val()+',';
            var fileName = this.$("#externalFileName").val()+',';
            var value = this.ajax('getField').done(function(data) {
                var value = data.user.user_fields[this.settings.field_key];
                if (value !== null) { bestData = value+this.$("#externalURL").val()+';';}
                else { bestData = this.$("#externalURL").val();}
                this.ajax('putField', bestData);
            });
        }

    };

}());
