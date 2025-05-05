/***************************************************************************
 *
 *   LiteBox
 *   An Adaptive Density Graphical Photo Browser written in Computed HTML
 *   © Copyright Gary Royal 2022, 2025
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *   GNU General Public License for more details.
 *
 ***************************************************************************/


// globals

var 
    last_width,             
    columns_per_row, 
    total_gutter_width, 
    max_img_width, 
    render_width, 
    gallery_width, 
    left_offset,
    page_length, 
    total_pages, 
    page_number, 
    column_height, 
    last_n, 
    start, 
    t, 
    page_length;


// settings

const
    responsive_columns = [0, 0, 2, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 6, 6, 7, 7, 8, 8, 9],
    gutter_size = 8,
    alt_max_width = 192,
    WIDTH = 0, HEIGHT = 1, ID = 2, AUTH = 3, UNSPL = 4, ROW = 5, // pointers into the catalog
    no = 0, yes = 1,
    spinner = 'aperture.gif',
    scheme = document.location.protocol;


// preferences

const
    PAGINATE = yes,
    DOWNLOAD_LIMIT = 0; // 0 = no limit, else truncate catalog to n = DOWNLOAD_LIMIT photos

if(DOWNLOAD_LIMIT) {
    catalog = catalog.slice(0,DOWNLOAD_LIMIT-1);
}



// Computed HTML runtime functions

function get_window_geometry() {

    window_width = function() {
        var x = 0;
        if (self.innerHeight) {
            x = self.innerWidth;
        } else if (document.documentElement && document.documentElement.clientHeight) {
            x = document.documentElement.clientWidth;
        } else if (document.body) {
            x = document.body.clientWidth;
        }
        return x;
    }(),

    window_height = function() {
        var y = 0;
        if (self.innerHeight) {
            y = self.innerHeight;
        } else if (document.documentElement && document.documentElement.clientHeight) {
            y = document.documentElement.clientHeight;
        } else if (document.body) {
            y = document.body.clientHeight;
        }
        return y;
    }(),

    scrollbar_width = function() {
        // Creating invisible container
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll'; // forcing scrollbar to appear
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
        document.body.appendChild(outer);

        // Creating inner element and placing it in the container
        const inner = document.createElement('div');
        outer.appendChild(inner);

        // Calculating difference between container's full width and the child width
        const scrollbar_width = (outer.offsetWidth - inner.offsetWidth);

        // Removing temporary elements from the DOM
        outer.parentNode.removeChild(outer);

        return scrollbar_width;
    }();

    viewport_width = window_width - scrollbar_width;
}


function $(el) {

    // that handy $('foo') shortcut thing

    try {
        return (typeof el == 'string') ? document.getElementById(el) : el;
    } catch (e) {
        if (debug) {
            alert(el);
        }
    }
}


function print_r(obj) {

    // dump an object to the console for debugging

    console.log(JSON.stringify(obj));
}


const
    svg_paths = {
        "menu" : '><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>',
        "info" : '<path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>',
        "exit" : '<path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>'
    };

    
function render_icon(name,size,fill) {

    name = name || 'error';
    size = size || 24;
    fill = fill || 'currentColor';

    return `<div style="margin:8px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" height="${size}" width="${size}" fill="${fill}">${svg_paths[name]}</svg></div>`;
}

function truncateIfZero(num) {
  const integerPart = Math.trunc(num);
  const decimalPart = num - integerPart;
  return decimalPart === 0 ? integerPart : num;
}

// lightbox functions

function lightbox_open(image_id) {

var
    window_size,
    image_size,
    aspect_ratio,
    image_axis,
    render_size,
    dpr,
    render_mode,
    download_size,
    render_url,
    adr,
    pip;


    $('lightbox').style.display = 'block';
    $('menu').style.visibility = 'visible';
    $('nfobox').style.visibility = 'hidden';    

    // adjust the display position of the nfobox to keep it centered

    $('nfobox').style.top = (window_height-260)/2 + 'px';
    $('nfobox').style.left = (window_width-260)/2 + 'px';


    // dimensions of the viewport in css pixels 

    window_size = [window_width, window_height],

    // dimensions of the image in css pixels

    image_size = [catalog[image_id][WIDTH],catalog[image_id][HEIGHT]],

    // aspect ratio of the image, e.g. 1.33:1, 1:2, etc.

    aspect_ratio = image_size[WIDTH] / image_size[HEIGHT],    

    // which aspect is longer? WIDTH (landscape), or HEIGHT (portrait)?

    image_axis = (aspect_ratio >= 1) ? WIDTH : HEIGHT,  

    // scale the rendition to fit the window
   
    render_size = (aspect_ratio >= 1) ? 
        [ window_size[WIDTH], Math.floor(window_size[WIDTH] / aspect_ratio) ] : 
        [ Math.floor(window_size[HEIGHT] * aspect_ratio), window_size[HEIGHT] ],

    // pixel density of the display. 1 = standard, 2+ = super

    dpr = devicePixelRatio;

    if(dpr==1 || image_size[image_axis] <= render_size[image_axis]) {

        // Standard HD

        render_mode = 0;

        if(image_size[image_axis] <= render_size[image_axis]) {

            download_size = render_size = image_size;

        } else {

            download_size = render_size;
        }

    } else if(dpr>1 && image_size[image_axis] >= dpr * render_size[image_axis]) {

        // Super HD 

        render_mode = 2;

        download_size = [dpr * render_size[WIDTH], dpr * render_size[HEIGHT]];

    } else {

        // Adaptive HD

        render_mode = 1;

        download_size = image_size;
    }

    render_url = `${scheme}//picsum.photos/id/${catalog[image_id][ID]}/${download_size[WIDTH]}/${download_size[HEIGHT]}`,

    // some statistics for comparison
    // adr - adaptive density ratio [ image pixels : hardware pixels ]
    // pip - percent interpolated pixels 

    adr = (render_mode>0) ? truncateIfZero((download_size[image_axis] / render_size[image_axis]).toFixed(2)) : 1,

    pip = (render_mode>0) ? Math.floor(100-((adr/dpr)*100)) : 0;

    $('nfobox').innerHTML = `
        <table>
            <tr>
                <td class="stub">Picsum ID:</td>
                <td class="col">#&thinsp;${catalog[image_id][ID]}</td>
            </tr>
            <tr>
                <td class="stub">Author:</td>
                <td class="col"><a href="https://unsplash.com/photos/${catalog[image_id][UNSPL]}" target="_blank">${authors[catalog[image_id][AUTH]]}</a></td>
            </tr>
            <tr>
                <td class="stub">Image:</td>
                <td class="col">${catalog[image_id][WIDTH]+'&thinsp;x&thinsp;'+catalog[image_id][HEIGHT]}</td>
            </tr>
            <tr>
                <td class="stub">Render:</td>
                <td class="col">${render_size[WIDTH] + '&thinsp;x&thinsp;' + render_size[HEIGHT]}</td>
            </tr>
            <tr>
                <td class="stub">Download:</td>
                <td class="col">${download_size[WIDTH] + '&thinsp;x&thinsp;' + download_size[HEIGHT]}</td>
            </tr>
            <tr>
                <td class="stub">Mode:</td>
                <td class="col">${(render_mode==2) ? 'Super HD' : ((render_mode==1) ? 'Adaptive HD' : 'Standard HD')}</td>
            </tr>
            <tr>
                <td class="stub">ADR int%:</td>
                <td class="col">[${adr}:${dpr}]  ${pip}%</td>
            </tr>
        </table>`;

    $('img01').src = spinner;        

    last_n = image_id;

    load_image(render_url);
}

function load_image(url) {

  var image = new Image();
  image.onload = function() {
    $('img01').src = image.src;        
  };
  image.onerror = function() {};
  image.src = url;
}

function lightbox_close() {

    nfobox_close();
    $('menu').style.visibility = 'hidden';
    $('lightbox').style.display = 'none';    
    //$('img01').src = spinner;
}


function nfobox_toggle() {

    if($('nfobox').style.visibility == 'hidden') {
        $('nfobox').style.visibility = 'visible';
    } else {
        $('nfobox').style.visibility = 'hidden';
    }
}


function nfobox_close() {

    if($('nfobox').style.visibility == 'visible') {
        $('nfobox').style.visibility = 'hidden';
    }
}




// gallery layout functions

function init() {

    last_width = viewport_width,

    columns_per_row = (viewport_width < 300) ? 1 : ((viewport_width > 2100) ? 12 : responsive_columns[Math.floor(viewport_width / 100)]);

    total_gutter_width = (columns_per_row + 1) * gutter_size,

    max_img_width = (Math.floor((viewport_width - total_gutter_width) / columns_per_row) * 4) / 4,

    render_width = (max_img_width >= alt_max_width) ? alt_max_width : max_img_width,

    gallery_width = (render_width * columns_per_row) + total_gutter_width,

    left_offset = Math.floor((viewport_width - gallery_width) / 2);

    page_length = (PAGINATE) ? Math.ceil(window_height / render_width) * columns_per_row * 2 : catalog.length,

    total_pages = Math.ceil(catalog.length / page_length),

    page_number = 1,

    column_height = new Array(columns_per_row);

    column_height.fill(gutter_size);
}


function fetch_page() {

    // fetch the next page from the catalog

    if(page_number > 0 && page_number <= total_pages) {

        var slice_start = (page_number * page_length) - page_length;

        return catalog.slice(slice_start, slice_start + page_length).map(function(value,index) {
            return value[ROW];
        });

    } else {
        return [];
    }
}


function auto_paginate() {

    // stream a page of thumbnails to the browser

    if(total_pages > 0) {

        var page = fetch_page();    

        page_length = page.length; 

        if(page_length > 0) {

            var i, // current image
                j, // current column
                image_size,
                aspect_ratio,
                image_axis,
                dpr,
                render_size,
                download_size,
                render_url,
                chtml = [],
                el;

            // For each photo in the page,

            for(i = 0; i < page_length; i++) {

                // find the column with the shortest height

                j = column_height.indexOf(Math.min(...column_height));

                // scale the image and compile a thumbnail

                // see the function lightbox_open() for an annotated description 
                // of the adaptive density algorithm

                image_size = [catalog[page[i]][WIDTH],catalog[page[i]][HEIGHT]],

                aspect_ratio = (image_size[HEIGHT] / image_size[WIDTH]),   

                image_axis = (aspect_ratio >= 1) ? WIDTH : HEIGHT,                   

                render_size = [ render_width, Math.floor(aspect_ratio * render_width) ],                

                dpr = devicePixelRatio,

                render_mode = (image_size[image_axis] >= dpr * render_size[image_axis]) ? 1 : 0,

                download_size = (render_mode) ? [dpr * render_size[WIDTH], dpr * render_size[HEIGHT]] : render_size,

                render_url = `${scheme}//picsum.photos/id/${catalog[page[i]][ID]}/${download_size[WIDTH]}/${download_size[HEIGHT]}`;

                chtml[i] = `<img class="brick" style="top:${ 
                    column_height[j]
                }px;left:${
                    left_offset + gutter_size + (j * (render_size[WIDTH] + gutter_size))
                }px;width:${
                    render_size[WIDTH]
                }px;height:${
                    render_size[HEIGHT]
                }px;" src="${ render_url }" alt="" loading=lazy onclick="lightbox_open(${
                    page[i]
                });">`; // <div class="brick-id"></div>

                // adjust the column height and continue with the next picture
  
                column_height[j] += render_size[HEIGHT] + gutter_size;
            }

            el = document.createElement('div');
            el.innerHTML = chtml.join('');
            $('gallery').appendChild(el);
        }
    }
}




// window control functions

function onScroll() {

    if(page_number >= 0) {

        if($('pga').scrollHeight - $('pga').scrollTop - $('pga').clientHeight < 1) {

            page_number++;
            auto_paginate();
        }
    }
}


function debounce(func) {

    // pause execution if window is being resized

    var timer;

    return function(event) {
        if(timer) clearTimeout(timer);
        timer = setTimeout(func,100,event);
    };
}


window.addEventListener("resize",debounce(function(e){

    // re-render gallery after resize or orientation change

    get_window_geometry();

    if (viewport_width != last_width) {

         $('gallery').innerHTML='';
         init();

        if($('lightbox').style.display == 'block') {

            lightbox_open(last_n);
        }

        auto_paginate();
    }
}));




// And Here. We. Go.

document.addEventListener("DOMContentLoaded", function(){

    get_window_geometry();

    init();

    $('form1').innerHTML = `
    <div id="browser">
    <header>
        <div id=logo>Litebox</div>
        <a href="https://github.com/Nanoonga/Litebox" role=button class=button>GitHub</a>
    </header>
        <div id="pga">
            <div id="gallery"></div>
        </div>
    </div>

    <div id="lightbox">
        <div id="imgdiv" class="cover" onclick="nfobox_toggle();">
            <img class="slide" id="img01" src="${ spinner }" alt="placeholder">
        </div>
    </div>

    <div id="nfobox" style="top:${(window_height-260)/2}px;left:${(window_width-260)/2}px;" onclick="nfobox_toggle();"></div>

    <nav id="menu" class="menu" style="visibility:hidden;">
        <div onclick="nfobox_toggle();">${render_icon("info",24)}</div>
        <div onclick="lightbox_close();">${render_icon("exit",24)}</div>
    </nav>`;

    if(PAGINATE) {

        // fetch and render the next page on scroll
        
        $('pga').addEventListener("scroll", onScroll);
    }

    // fetch and render the first page

    auto_paginate();
});
