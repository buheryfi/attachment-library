(function() {
    var self = this;
    var current_page = 0;
    var previous_page;
    var per_page = 9;
    var next_page;

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
            'click li.clickable':'add_colour', 
        
            'mouseover .more-info': function(e) {
              this.$(e.target).popover('show');
            },
            
            // Navigate paginated content with Next, Previous, or Direct Page Link
            'click .page_link': function(e) {
                current_page = parseInt(this.$(e.target).val(), 10);
                if (this.$('#get_library').hasClass('active')){
                    this.renderLibrary(current_page);
                } else if (this.$('#getImage').hasClass('active')) {
                    this.renderTicket(current_page);
                }
            },
            
            //working with images in ticket
            'click #getImage': 'renderTicket',
            'click #add_images' : 'addToLibrary',
            'click #add_text' : 'addTextToLibrary',

            //working with images inside of library
            'click #get_library':'renderLibrary', 
            'click #embed_images':'embedImages',
            'click #embed_link':'embedLinks',
            'click #remove_images':'removeImages',
            'click #preview_item': 'previewItem',

            // working with Remote Content
            'click #getExternal': 'getExternal',
            'click #addExternal': 'addExternalToLibrary'
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

        renderTicket: function(current_image_page) {
            // load all attachments from current ticket
            var attachments = [];

            if (typeof current_image_page !== "number"){
                current_image_page = 0;
            }
            
            this.comment().attachments().forEach(function(comment){
                var object = {};

                if (comment.contentType().indexOf("image") > -1) {
                    object.url = comment.contentUrl();
                    object.name = comment.filename();
                    object.type = "image";
                    attachments.push(object);
                } else {
                    object.url = comment.contentUrl();
                    object.name = comment.filename();
                    object.type = "text";
                    attachments.push(object);
                }
            });
            
            this.ticket().comments().forEach(function(comment){
                comment.nonImageAttachments().forEach(function(nonImage){
                    var object = {};
                    object.url = nonImage.contentUrl();
                    object.name = nonImage.filename();
                    object.type = "text";
                    attachments.push(object);
                });
                comment.imageAttachments().forEach(function(image){
                    var object = {};
                    object.url = image.contentUrl();
                    object.name = image.filename();
                    object.type = "image";
                    attachments.push(object);
                });
                
                var regex = comment.value().match(/<img.*src=["'](.*)["'].*">/gi);
                if (regex !== null) {
                    for (i = 0; i < regex.length; ++i) {
                        var object = {};
                        var url = regex[i].match(/src=["'](.+?)["']/gi);
                        object.url = url.toString().substring(5, url[0].length - 1);
                        var alt = regex[i].match(/alt=["'](.+?)["']/gi);
                        object.name = (alt !== null) ? alt.toString().substring(5, alt[0].length - 1) : this.I18n.t('alt');
                        object.type = "image";
                        attachments.push(object);
                    }                    
                }
            });
            
            // if no images, show no images and break.
            if(attachments.length === 0) {
                this.switchTo("ticket", {imageList: "<li class=\"imgbox\"><br>"+this.I18n.t('errors.ticket_empty')+"</li>"});
                return;
            }

            //  render attachments
            var number_of_items = attachments.length;
            var pagination = this.paginate(attachments, current_image_page, number_of_items);
            var attachment;
            var attachmentList = "";
            var end_of_list = per_page*(current_image_page+1);
            var beg_of_list = per_page*current_image_page;
            if (end_of_list > number_of_items) {
                end_of_list = number_of_items;
            }
            for (var i = beg_of_list; i < end_of_list; i++){
                if (attachments[i] !== null){
                    if (attachments[i].type == "text"){
                        attachmentList += this.renderTemplate("imgbox",
                        {
                            type: attachments[i].type,
                            src: '',
                            alt: attachments[i].name,
                            height: 0,
                            width: 0,
                            top: 0,
                            left: 0,
                            data_url: attachments[i].url,
                            data_title: attachments[i].name,
                            data_content: attachments[i].url
                        });
                    } else if (attachments[i].type == "image"){
                        attachment = this.resizeImage(attachments[i].url);
                        attachmentList += this.renderTemplate("imgbox",
                        {
                            type: attachments[i].type,
                            src: attachments[i].url,
                            alt: attachments[i].name,
                            height: attachment.height,
                            width: attachment.width,
                            top: (82-attachment.height)/2,
                            left: (82-attachment.width)/2,
                            data_url: attachments[i].url,
                            data_title: attachments[i].name,
                            data_content: attachments[i].url
                        });
                    }
                    else {return;}
                }
            }
            this.switchTo("ticket", {imageList: attachmentList, pagination: pagination});
        },
        
        paginate: function(array, current_page, number_of_items) {
            var number_of_pages = Math.ceil(number_of_items/per_page);
            
            if (current_page === 0) { 
                previous_page = 0;
                navigation_html = '<button type="button" class="page_link left_end" disabled value="'+previous_page+'"><-</button>';
            } else {
                previous_page = current_page - 1;
                navigation_html = '<button type="button" class="page_link left_end" value="'+previous_page+'"><-</button>';
            }
            
            for(var i = 0; i < number_of_pages; i++){
                if (i == current_page){
                    navigation_html += '<button type="button" class="page_link current middle" disabled value="'+i+'">' + (i + 1) +'</button>';
                } else {
                    navigation_html += '<button type="button" class="page_link middle" value="'+i+'">' + (i + 1) +'</button>';
                }
            }
            
            if (current_page+1 >= number_of_pages) { 
                next_page = number_of_pages;
                navigation_html += '<button type="button" class="page_link right_end" disabled value="'+next_page+'">-></button>';
            } else {
                next_page = current_page + 1;
                navigation_html += '<button type="button" class="page_link right_end" value="'+next_page+'">-></button>';
            }
            
            var pagination = this.renderTemplate('pagination', { page_navigation: navigation_html });
            
            return pagination;
        },

        renderLibrary: function() {
            // load library page template, get data from user field and render thumbnails
            this.ajax('getField').done(function(data) {
                self.library = data.user.user_fields[this.settings.field_key];
                current_page |= 0;
    
                if(self.library == null) {
                    this.switchTo("library", {imageList: "<li class=\"imgbox\"><br>"+this.I18n.t('errors.library_empty')+"</li>"});
                    return;
                }
                
                var attachment_list = JSON.parse(self.library);
                var number_of_items = attachment_list.length;
                var pagination = this.paginate(attachment_list, current_page, number_of_items);           
                var img;
                var imageList = "";
                var end_of_list = per_page*(current_page+1);
                var beg_of_list = per_page*current_page;
                if (end_of_list > number_of_items) {
                    end_of_list = number_of_items;
                }
                
                for (var i = beg_of_list; i < end_of_list; i++){
                    if (attachment_list[i] !== null){
                        var imageObject = {};
                        if (attachment_list[i].type == "image"){
                            imageObject = this.resizeImage(attachment_list[i].url);
                            imageObject.top = (82-imageObject.height)/2;
                            imageObject.left = (82-imageObject.width)/2;
                        } else if (attachment_list[i].type == "text") {
                            imageObject = new Image();
                            imageObject.height = 0;
                            imageObject.width = 0;
                            imageObject.top = 0;
                            imageObject.left = 0;
                        }
                        imageObject.alt = attachment_list[i].alt;
                        imageObject.data_url = attachment_list[i].url;
                        imageObject.type = attachment_list[i].type;
    
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
                this.switchTo("library", {imageList: imageList, pagination: pagination});
            });
        },

        resizeImage: function(object) {
            var img = new Image(82, 82);
            img.src = object;
                // this is for resizing and maintaining aspect ratio - currently it works, but sometimes it fires after the image is added, resulting in a blank.  Need to make it populate before the image is added to the page...
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
            if ( numItems > 1) {
                this.$("#preview_item").prop("disabled", true); 
            } else if ( numItems <= 1) {
                this.$("#preview_item").prop("disabled", false); 
            }
            this.$(".hidden").removeClass("hidden");
        },

        // add attachments to library, including URL, name, and type (txt or image)
        addToLibrary: function(data){
            var value = this.ajax('getField', data).done(function(data) {
                var put_data = (data.user.user_fields[this.settings.field_key]) ? JSON.parse(data.user.user_fields[this.settings.field_key]) :[] ;
                this.$(".highlight").each(function(i, val) {
                    var alt = val.children[0].children[0].getAttribute("alt");
                    if (val.getAttribute("class").indexOf("image") !== -1 ) {
                        var image_array = {};
                        image_array.url = val.children[0].children[0].getAttribute("src");
                        image_array.alt = alt;
                        image_array.type = "image";
                        put_data.push(image_array);
                    }
                    else if (val.getAttribute("class").indexOf("doc")) {
                        var doc_array = {};
                        doc_array.url = val.children[0].children[0].getAttribute("data-contentURL");
                        doc_array.alt = alt;
                        doc_array.type = "text";
                        put_data.push(doc_array);
                    }
                });
                put_data = JSON.stringify(put_data).replace(/"/g, "\\\"");
                this.ajax('putField', put_data).done(function() {
                    services.notify(this.I18n.t('add.done'));
                }).fail(function() {
                    services.notify(this.I18n.t('add.fail'));
                });
            });
        },

        // Remove attachment from user field
        removeImages: function(data){
            this.ajax('getField').done(function(data) {
                var put_data = JSON.parse(data.user.user_fields[this.settings.field_key]);
                self.$(".imgbox").each(function(i, val) {
                    if (self.$(this).hasClass("highlight")){
                        put_data.splice(i, 1);
                    }
                });
                put_data = JSON.stringify(put_data).replace(/"/g, "\\\"");
                this.ajax('putField', put_data).done(function(data) {
                    self.library = data.user.user_fields[this.settings.field_key];
                    services.notify(this.I18n.t('remove.done'));
                    this.renderLibrary();
                }).fail(function() {
                    services.notify(this.I18n.t('remove.fail'));
                });
            });               
        },

        // Embed image with Markdown based on user action
        embedImages: function(data){
            put_data = '';
            self.$(".highlight").each(function(i, val) {
                put_data += "!["+this.I18n.t('markdown')+"]("+val.children[0].children[0].getAttribute("src")+") " + "\n";
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

        // Preview item in iframe - use Google Docs API for text files
        previewItem: function(data, target){
            var url;
            if (self.$(".highlight").hasClass('image')) {
                url = self.$(".highlight > div > img").attr('data-contenturl');
            } else if (self.$(".highlight").hasClass('text')) {
                var log = self.$(".highlight > div > img").attr('data-contenturl');
                url = "http://docs.google.com/viewer?url="+log+"&embedded=true";
            }
            this.$('#modalIframe').attr('src', url);
            this.$('#myModal').modal('show');
        },

        getExternal: function() {
            this.switchTo("external");
        },

        //  Allow end-user to add externally hosted files to library
        addExternalToLibrary: function() {
            var ERRORS = {
              ext: [
                this.I18n.t('errors.url'),
                this.I18n.t('errors.nickname'),
                this.I18n.t('errors.type')
              ]
            };
            var fields, values, errout = false;
            fields = [this.$("#externalURL"), this.$("#externalFileName"), this.$(".type-btn.active")];
            values = [fields[0].val(), fields[1].val().replace(/[,;]/g,""), fields[2].data("type")];
            values.map(function(d,i){
                if(!d) {
                    fields[i].addClass("field-error");
                    services.notify(ERRORS.ext[i], 'error');
                    errout |= true;
                } else if(i === 0 && d.indexOf("https://") !== 0) {
                    fields[i].addClass("field-error");
                    services.notify(ERRORS.ext[i], 'error');
                    errout |= true;
                }
            });
            if(errout) return;
            fields.forEach(function(d) {
                d.removeClass('field-error'); 
                this.$(d).val("");
            });

            this.ajax('getField').done(function(data) {
                var put_data = (data.user.user_fields[this.settings.field_key]) ? JSON.parse(data.user.user_fields[this.settings.field_key]) :[] ;
                var image_array = {};
                image_array.url = values[0];
                image_array.alt = values[1];
                image_array.type = values[2];
                put_data.push(image_array);
                put_data = JSON.stringify(put_data).replace(/"/g, "\\\"");
                this.ajax('putField', put_data).done(function() {
                    services.notify(this.I18n.t('add.done'));
                }).fail(function() {
                    services.notify(this.I18n.t('add.fail'));
                });
            });
        },

        removeFieldError: function(e) {
            this.$(e.target).removeClass("field-error");
        }

    };

}());
