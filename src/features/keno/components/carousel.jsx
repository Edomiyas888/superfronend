import React, { useState } from "react";
import { Box, IconButton } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const Carousel = ({ slides, width = "97%" }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideCount = slides.length;

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slideCount - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev === slideCount - 1 ? 0 : prev + 1));
  };

  return (
    <Box
      sx={{
        position: "relative",
        width,
        mx: "auto",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: `${slideCount * 100}%`,
          transform: `translateX(-${(currentSlide * 100) / slideCount}%)`,
          transition: "transform 0.5s ease",
        }}
      >
        {slides.map((slide, index) => (
          <Box key={index} sx={{ flex: "0 0 100%" }}>
            {slide}
          </Box>
        ))}
      </Box>
      <IconButton
        onClick={handlePrev}
        sx={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "white",
        }}
      >
        <ArrowBackIosIcon />
      </IconButton>
      <IconButton
        onClick={handleNext}
        sx={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "white",
        }}
      >
        <ArrowForwardIosIcon />
      </IconButton>
    </Box>
  );
};

export default Carousel;
