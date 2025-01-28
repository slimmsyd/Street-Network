"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Link as LucideLink, Rocket, Shield, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
// Add these new imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import GetStarted from "@/components/getstarted";
import Pricing from "@/components/pricing";
import Reason from "@/components/reason";
import About from "@/components/about";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { gsap } from "gsap";
import Lenis from "@studio-freight/lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import Image from "next/image";
import FooterWrapper from "@/components/footer-wrapper";
import SalesVideo from "@/components/salesVideo";
import SignUpPage from "./signup/page";

export default function Home() {




  // Add state for dialog
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  // Add new state for notification dialog
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState({
    type: "",
    message: "",
  });
  const [activeTab, setActiveTab] = useState("Valut");
  const [formData, setFormData] = useState({
    email: email,
    location: "",
    phoneNumber: "",
    gender: "",
    age: "",
    name: ""
  });
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Family Legacy",
      description: "Preserve your family's legacy with our secure digital platform. Create lasting memories that can be shared across generations.",
      image: "/home/FamilyLed.png",
      bgColor: "bg-[#F8F7FF]"
    },
    {
      title: "Organized Memories",
      description: "Keep your family memories organized and accessible. Create a structured archive that makes it easy to find and relive precious moments.",
      image: "/home/Arc.png",
      bgColor: "bg-[#F0FFF4]"
    },
    {
      title: "Immutable Archives",
      description: "Preserve your family history with blockchain technology, ensuring your memories are securely stored and accessible for generations to come.",
      image: "/home/DigitalLed.png",
      bgColor: "bg-[#FFF5F5]"
    }
  ];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };


  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    } as any);

    // Create the animation frame
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    // Start the animation
    requestAnimationFrame(raf);

    // Register lenis as the scroll source for ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.defaults({ scroller: document.documentElement });

    // Cleanup
    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await axios.post("/api/newsletter", formData);

      console.log(result.data);

      if (result.data.success) {
        setNotificationMessage({
          type: "success",
          message: "Successfully joined the waitlist!",
        });
        setIsOpen(false);
        setFormData({ email: "", location: "", phoneNumber: "", gender: "", age: "", name: "" });
      } else {
        setNotificationMessage({
          type: "error",
          message: result.data.message || "Email already registered",
        });
      }
    } catch (error) {
      setNotificationMessage({
        type: "error",
        message: "Failed to join waitlist. Please try again.",
      });
    }
    setShowNotification(true);
  };

  // Add this content mapping object at the component level (before the return statement)
  const tabContent = {
    Valut: {
      text: "Families can create digital legacies that stand the test of time, ensuring that memories are preserved even as digital technologies evolve. This long-term preservation aspect not only benefits immediate family members but also creates a historical record that can be shared with future generations, fostering a sense of connection to the past.",
    },
    "Data Privacy & Control": {
      text: "Preserve your family's memories forever with cutting-edge blockchain technology. Powered by Arweave, our platform offers advanced encryption and immutable storage, ensuring your digital legacy remains secure, private, and accessible only to those you trust. Take full control of your memories with unparalleled protection and peace of mind  .",
    },
    Personalization: {
      text: "Create a unique family archive that reflects your heritage and values. Customize how you organize and present your family's story with flexible templates, tagging systems, and custom categories that make sense for your family's unique narrative.",
    },
    "Collaboration & Engagement": {
      text: "Bring your family closer with AI-powered collaboration. Our technology intelligently connects the dots—identifying relationships, occupations, birthdays, and locations—to make your family tree more meaningful. Multiple family members can contribute photos, documents, and stories, creating a dynamic, ever-https://www.youtube.com/watch?v=yfB_fHCqwsQrowing archive enriched by each generation's input. ",
    },
  };

  return (
    <>


      <SignUpPage />

      <FooterWrapper />

      {/* <section id="getstarted">
        <GetStarted />
      </section> */}
      {/* <section id="getstarted">
        <SalesVideo />
      </section>
      <section id="pricing">
        <Pricing />
      </section> */}
    </>
  );
}
