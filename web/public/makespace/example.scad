// Make a block with a hole. All sizes are in millimeters.
width = 40; // [20:1:80]
height = 15; // [5:1:35]
hole = 10; // [4:1:16]
/* [Hidden] */
$fn=48;
difference() {
 cube([width,30,height],center=true);
 cylinder(d=hole,h=height+2,center=true);
}
