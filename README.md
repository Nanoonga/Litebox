# LiteBox

> An Adaptive Density Graphical Photo Browser written in Computed HTML

![litebox.jpg](Litebox.jpg)

# 

## Overview

**LiteBox** is a dpi-aware media browser that tries to render photos with the finest practical image detail on all devices, at all times. It does not require a Super HD video display, but takes full advantage of one if available.

LiteBox is a written in **Computed HTML**, a programming model where the tags describing a web page are assembled in JavaScript and rendered by the browser's HTML interpreter. 

LiteBox introduces **Adaptive Density**, a strategy for optimizing image quality by adjusting the download resolution for each image to match the pixel density of the screen it's being displayed on. 

## Getting Started

* [**View the Live Demo**](https://nanoonga.github.io/Litebox/) on your PC, notebook, phone and tablet, or

* Clone or download the repo, and drag the file index.html into an open browser window, then

* Browse the source and adapt what you like to your own projects

## Computed HTML

Computed HTML (CHTML) is a method for developing arbitrarily sophisticated web applications in plain JavaScript, independent of any framework or library. CHTML is orders of magnitude faster than conventional Dynamic HTML (DHTML).

CHTML uses JavaScript to compile a document layout in RAM and passes it to the browser's HTML interpreter as immediate data, rendering the layout in a single pass.

Because all necessary attributes are specified, the browser never has to backtrack or repaint. The user interface is rendered instantly, and becomes interactive in a fraction of a second regardless of layout complexity. 

## Adaptive Density

Super HD (our term for HiDPI video displays like Apple's "Retina") considerably improve the display quality of photos by providing four (or more) hardware pixels per CSS pixel, but only if the software is aware of such pixels and has the means to format images to fill those pixels with detail.

However, [the `srcset` attribute of the HTML`<img>` element](https://www.oxyplug.com/optimization/device-pixel-ratio#serve-image-img-tag-based-on-dpr) is grossly unsuitable for any practical (large, heterogenous, dynamic) media collection because it would involve rendering, storing, and serving a different version of every image for every supported DevicePixelRatio at every presentation size in order for the browser to automagically choose the "best" rendition for the circumstances. 

*Adaptive Density* is an algorithm that scales arbitrary images to arbitrary presentation sizes at arbitrary pixel densities. This function may be (re)applied to an image whenever the display geometry changes, such as when the window is resized, or the device is rotated. The image may then be downloaded from a server capable of scaling images to requested dimensions. 

### Rendition Modes

**Standard HD** [1:dpr] -- All displays with a devicePixelRatio of 1, and all images where image size <= render size. Images are downsampled as necessary for Standard HD displays, but never upsampled for Super HD displays because there would be fewer than one image pixel per four or more hardware pixels  (>=75% interpolation) at a considerable reduction in image quality. 

**Super HD** [dpr:dpr] -- Super HD displays where image size >= devicePixelRatio * image size. Images are fetched at a multiple of the devicePixelRatio, yielding one image pixel per hardware pixel. The best rendition the display is capable of.

**Adaptive HD** [adr:dpr] -- SuperHD displays where render size < image size < devicePixelRatio * image size. Images are downloaded at their original size, and upsampled by the browser to align with the devicePixelRatio, where dpr > adr > 1. The best rendition the display is capable of *under the circumstances*, ranging from better than Standard HD to indistinguishable from Super HD.

### Rendition Metrics

*Adaptive Density Ratio (ADR)* -- image pixels per device pixel (1:1, 1.41:2, etc). The shortfall in image resolution expressed as a ratio. The greater the difference, the more the image has to be spread to fit.

*Percent Interpolated Pixels (PIP)* -- What percentage of the image is composed of pseudo-pixels interpolated by the browser's image scaler to enlarge the image to presentation size.  

**Listing 1: Adaptive Density** 

```js
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
```

### notes

- High resolution does not necessarily mean high detail. There are low resolution pictures with high detail, and high resolution pictures with low detail. The origin media (film or digital), source (casual uploads or managed collections), and subject (people, places, artwork) will vary from one picture to the next.

- It may surprise you how little the rendition quality is affected even with a considerable fraction of interpolated pixels. I believe that on Apple devices especially, the image scaler is probably tuned to the display panel, and this is the primary reason that we put the browser in charge of any upscaling to be done rather than downloading an upscaled image from the server. 

- It is a property of raster graphic images that downsampling increases sharpness of definition, so nearly all images will exhibit improved detail even on Standard HD displays simply by being properly scaled for the presentation context. 

---

**Table 1: geometries of a small sample of video displays**

| device                    | resolution | dpr  | ppi             | viewport  |
| ------------------------- | ---------- | ---- | --------------- | --------- |
| 27" PC monitor            | 1920x1080  | 1.00 | 82              | 1920x1080 |
| 9.7" iPad                 | 768x1024   | 1.00 | 132<sup>1</sup> | 768x1024  |
| 27" iMac 2020             | 2560x1440  | 2.00 | 109<sup>1</sup> | 1280x720  |
| 12.9" iPad Pro            | 2048x2732  | 2.00 | 264             | 1024x1366 |
| 3.5" iPhone 4             | 640x960    | 2.00 | 326             | 320x480   |
| 5.8" Pixel 4a             | 1080x2340  | 2.75 | 443             | 393x851   |
| 6.1" iPhone 13            | 1170x2532  | 3.00 | 460             | 390x844   |
| 6.8" Galaxy S23 Ultra     | 1440x3088  | 4.00 | 501             | 360x772   |
| 14.6" Galaxy Tab S8 Ultra | 1848x2960  | 4.00 | 240             | 462x740   |

<sup>1</sup> It's interesting that a 2011 iPad has a finer dot pitch than a 2020 iMac, despite the iMac being a Super HD ("Retina 5K") display.

---

## Lorem Picsum

**[Lorem Picsum](https://picsum.photos/)** is an image placeholder service that allows us to download arbitrary photos at arbitrary sizes to demonstrate the placement of images in a layout.

Their generous contribution of a scaling image server and photo collection to the public interest made this demonstration possible.

Information about Picsum placeholders is stored in an array called the *catalog*:

```javascript
var catalog = [
    // [width, height, picsum ID, author ID, unsplash ID, row]
    [5000,3333,396,482,"ko-wCySsj-I",0],
    [4240,2832,667,283,"XMcoTHgNcQA",1],
    ...
    [3872,2592,348,40,"mVhd5QVlDWw",892]
];
```

*Author ID* = Index of the author's name in the author table for photo credit

*Unsplash ID* = URL path to the photo on [**Unsplash**](https://unsplash.com/about), an archive of free-to-use high-resolution photos

*Row* = the ordinal number of the item in the catalog array

## Wisdom

> *"Anyone can build a fast CPU. The trick is to build a fast system."*
> 
> -- Seymour Cray
