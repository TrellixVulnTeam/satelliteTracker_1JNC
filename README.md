Welcome to my satellite tracker project! Read below for an explanation of the project and the different branches:

I have a few iterations of the project in this repo, which I've created as I learned more and have gotten familiar with different frameworks and toolsets. The current iteration is on the node_electronjs branch of this repo. The first version is on the master branch of the repo and doesn't currently work, as some dependencies have changed. I was started a few years back, and hasn't been updated in some time. It's honestly a little bit of a mess.

The flask_implentation branch contains the second iteration, after I had learned more about better structuring my code. I had decided to use flask, as I was using python as a back end for the project anyway. While a little better than the first iteration of this project, it is not elegant in any way.

The node_electronjs branch is the one I will be working on going forward, and will eventually merge it into the master branch. Until then, I wanted to have a record of my attempts at creating a project I was really passionate about, and how far I've come from just barely understanding javascript and APIs. I have decided to use node and electron as foundations for my project because I wanted to have a project that was an actual desktop application. I am slowly pulling the good parts of the flask implementation into this one. This time around, I have a plan and an idea of how to structure my project. Some updates I am implementing are:

   I only ever had the earth and satellites shown, with a spotlight acting as the sun, spinning around the globe. Now I'm adding a sun that the earth revolves around, and the     moon that revolves around the earth.
    
   Better implentation of Three.js that will allow for smoother animations and less clunky button controls. I didn't know what I was doing to begin with, but have since learned more about the library.
    
   Adding an honest-to-goodness database on the backend. I was using a .csv file to hold over 100,000 satellite positions before, as I had no experience using databases previously. Obviously a mistake, but I've learned my lesson! My first thought was to go with MySQL for the project, but I want something lightweight that doesn't have to be downloaded by someone trying out my code, so I am implementing SQLite instead.
    
   A better orbital propogation library, with documentation fully read this time. The current plan is to use the SPICE toolkit, either in Java or using a Python wrapper. More information on the toolkit here: https://naif.jpl.nasa.gov/naif/index.html
   
\
    
To sum it up, space has always been a passion of mine. I always wanted to be an astronaut or work with NASA in some way. Coding is another huge passion of mine. So after getting some experience working with orbital mechanics in a professional setting, I decided it was time to combine these two passions into a fun project to show what I've learned.
