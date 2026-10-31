# Neural-Networks


A one page, scroll driven site that explains how neural networks work and lets you try one out straight in the browser. Draw a digit and a pre-trained MNIST model will predict what you've drawn.

## What it does



- It Explains the fundamentals of neural networks: neurons, weights, layers, activations and training.
- An interactive digit recognition demo built around a 28x28 grayscale drawing canvas.
- Walks through the entire prediction pipeline: drawing, cropping, resizing, normalising and then running the inference.
- It displays the model's scores for digits 0-9 as simple bars.
- A few real world applications of neural networks (like, Healthcare, finance, Language, Vision, autonomy).


## How it works

The demo is 100% client side. Your drawing is processed in the browser, converted into the format the model expects and sent to a pre-trained MNIST classifier. Nothing gets uploaded and the model isn't trained or updated in any way by your drawings. It just does inference.


## Built with

- HTML, CSS, and vanilla JavaScript
- GSAP for scroll-based animations and page motion
- Canvas API for the drawing surface
- TensorFlow.js for loading and running the pre-trained MNIST model
- A public MNIST model by Carlos Aguayo
- Most of the information is taken from Wikipedia and other reliable sources 

## Notes


- This is a frontend only project (no backend).
- Built for 𝗣𝗶𝘅𝗲𝗹 𝗖𝗼𝗻𝘁𝗲𝘀𝘁 𝟱.𝟬’s 𝗪𝗲𝗯𝘀𝗶𝘁𝗲 𝗗𝗲𝘀𝗶𝗴𝗻𝗶𝗻𝗴 𝗮𝗻𝗱 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗺𝗲𝗻𝘁 𝗖𝗼𝗺𝗽𝗲𝘁𝗶𝘁𝗶𝗼𝗻