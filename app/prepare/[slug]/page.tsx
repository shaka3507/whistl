"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingChatButton } from "@/components/floating-chat-button";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeftCircle,
  AlertTriangle,
  ArrowRightCircle,
  BookOpen,
  ExternalLink,
  ChevronDown,
  Search,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
// Define the type for the JSON data structure
interface PrepareData {
  title: string;
  description: string;
  is_module?: boolean;
  sections: {
    title: string;
    content: string;
  }[];
  resources: {
    title: string;
    url: string;
  }[];
  questions?: {
    question: string;
    options: string[];
    answer: string;
    image?: string;
  }[];
}

const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      border: 0,
      clip: "rect(0 0 0 0)",
      height: "1px",
      margin: "-1px",
      overflow: "hidden",
      padding: 0,
      position: "absolute",
      width: "1px",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

export default function PreparePage() {
  const { slug } = useParams();
  const [data, setData] = useState<PrepareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<
    PrepareData["questions"] | null
  >(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const quizRef = useRef<HTMLDivElement>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: number]: string;
  }>({});
  const [quizResults, setQuizResults] = useState({
    correctAnswers: 0,
    totalQuestions: 0,
    percentageCorrect: 0,
  });
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  const handleOptionSelect = (option: string) => {
    setSelectedOptions({ ...selectedOptions, [currentQuestion]: option });
  };

  const goToNext = async () => {
    if (currentQuestion < (quizQuestions?.length || 1) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Evaluate answers
      const correctAnswers =
        quizQuestions?.filter((q, index) => q.answer === selectedOptions[index])
          .length || 0;
      const totalQuestions = quizQuestions?.length || 1;
      const percentageCorrect = (correctAnswers / totalQuestions) * 100;

      // Display results in modal
      setQuizResults({
        correctAnswers,
        totalQuestions,
        percentageCorrect,
      });
      setIsQuizCompleted(true);
    }
  };

  const handleModalClose = async () => {
    // Get the user ID from Supabase auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("User not authenticated");
      return;
    }

    // Save completion status to Supabase
    try {
      const { error } = await supabase
        .from("module_progress")
        .insert([{ module_name: slug, user_id: user.id, completed: true }]);

      if (error) {
        throw error;
      }
      setIsQuizCompleted(true);
      setIsQuizOpen(false);
      console.log("Progress saved successfully");
    } catch (error) {
      setIsQuizCompleted(false);
      console.error("Error saving progress:", error);
    }

    // Reset quiz state
    setIsQuizCompleted(true);
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Handle scroll to update text color
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;

      // Calculate scroll progress (0 to 1)
      const progress = Math.min(scrollTop / (documentHeight - windowHeight), 1);
      setScrollProgress(progress);
    };

    // Initial calculation
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Attempt to fetch data from the public JSON file based on slug
        const response = await fetch(`/data/prepare/${slug}.json`);

        if (!response.ok) {
          throw new Error(`Failed to load data for ${slug}`);
        }

        const jsonData = await response.json();
        setData(jsonData);
        setQuizQuestions(jsonData.questions);
        setError(null);
      } catch (err) {
        console.error(`Error loading prepare data for ${slug}:`, err);
        setError(
          `Unable to load information for "${slug}". Please try another topic.`
        );
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const scrollToQuiz = () => {
    if (quizRef.current) {
      quizRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Determine dark mode class based on scroll progress - always true in dark theme
  const isDarkMode = true;

  // Calculate text color styles based on scroll progress
  const getTextColorStyle = (baseProgress = 0) => {
    // Adjust progress to create a staggered effect for different sections
    const adjustedProgress = Math.max(
      0,
      Math.min(1, scrollProgress * 1.5 - baseProgress)
    );

    // Interpolate between light grey and pure white text
    const startColor = [220, 220, 220]; // RGB for light grey text
    const endColor = [255, 255, 255]; // RGB for white text

    const r = Math.round(
      startColor[0] + (endColor[0] - startColor[0]) * adjustedProgress
    );
    const g = Math.round(
      startColor[1] + (endColor[1] - startColor[1]) * adjustedProgress
    );
    const b = Math.round(
      startColor[2] + (endColor[2] - startColor[2]) * adjustedProgress
    );

    return {
      color: `rgb(${r}, ${g}, ${b})`,
      transition: "color 0.3s ease-out",
    };
  };

  // Get background style based on scroll progress
  const getBackgroundStyle = () => {
    // Create a gradient that stays black and gradually introduces very subtle color
    const black = [0, 0, 0]; // RGB for pure black (starting color)
    const darkCharcoal = [15, 15, 15]; // RGB for very dark charcoal (ending color)

    // Calculate interpolated color based on scroll progress
    const r = Math.round(
      black[0] + (darkCharcoal[0] - black[0]) * scrollProgress
    );
    const g = Math.round(
      black[1] + (darkCharcoal[1] - black[1]) * scrollProgress
    );
    const b = Math.round(
      black[2] + (darkCharcoal[2] - black[2]) * scrollProgress
    );

    // Create subtle gradient effect
    const gradient = `linear-gradient(to bottom, 
            rgb(${black[0]}, ${black[1]}, ${black[2]}) 0%, 
            rgb(${r}, ${g}, ${b}) 100%)`;

    return {
      background: gradient,
      transition: "background 0.5s ease-out",
    };
  };

  // Enhanced fade in style that requires scrolling to see elements
  const getFadeStyle = (startPoint = 0.1, endPoint = 0.3) => {
    // Element becomes visible only after startPoint and reaches full opacity at endPoint
    const fadeIn = Math.min(
      1,
      Math.max(0, (scrollProgress - startPoint) / (endPoint - startPoint))
    );

    return {
      opacity: fadeIn,
      transform: `translateY(${(1 - fadeIn) * 25}px)`,
      transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
    };
  };

  // Filter sections based on search term
  const filteredSections = useMemo(() => {
    if (!data || !searchTerm.trim()) {
      return data?.sections || [];
    }

    const lowerCaseSearch = searchTerm.toLowerCase();

    return (data.sections || []).filter(
      (section) =>
        section.title.toLowerCase().includes(lowerCaseSearch) ||
        section.content.toLowerCase().includes(lowerCaseSearch)
    );
  }, [data, searchTerm]);

  // Check if any sections are filtered out
  const hasFilteredResults =
    searchTerm.trim() !== "" &&
    data?.sections &&
    filteredSections.length > 0 &&
    filteredSections.length < data.sections.length;

  const openQuiz = () => {
    if (data?.questions) {
      setQuizQuestions(data.questions);
    }
    setIsQuizOpen(true);
    console.log("Quiz Opened:", isQuizOpen);
  };

  // Loading state with black theme
  if (isLoading) {
    return (
      <div className="bg-black min-h-screen">
        <Header />
        <div className="container py-8 flex justify-center items-center min-h-[50vh]">
          <div className="text-center text-gray-200">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-lg">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state with black theme
  if (error) {
    return (
      <div className="bg-black min-h-screen">
        <Header />
        <div className="container py-8">
          <div className="bg-red-950 border border-red-800 rounded-lg p-6 flex items-start text-red-100">
            <AlertTriangle className="text-red-400 mr-4 mt-1 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-red-300 mb-2">
                Content Not Found
              </h1>
              <p className="text-red-100 mb-4">{error}</p>
              <Link href="/prepare">
                <Button
                  variant="outline"
                  className="border-red-500 text-red-300 hover:bg-red-950"
                >
                  Return to Prepare Library
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have data, display the content with dark theme
  return (
    <div
      style={getBackgroundStyle()}
      className="min-h-screen prepare-transition overflow-x-hidden prepare-content prepare-dark-mode"
    >
      {/* Background glow effects */}
      <div
        className="prepare-dark-glow fixed top-[20%] left-[10%]"
        style={{
          opacity: Math.max(0, scrollProgress * 0.08 - 0.02),
          transform: `scale(${1 + scrollProgress * 0.5})`,
          transition: "transform 0.5s ease-out, opacity 0.5s ease-out",
          background:
            "radial-gradient(circle, rgba(255, 255, 255, 0.07), rgba(120, 120, 120, 0.03))",
        }}
      />
      <div
        className="prepare-dark-glow fixed bottom-[30%] right-[15%]"
        style={{
          opacity: Math.max(0, scrollProgress * 0.09 - 0.02),
          transform: `scale(${0.8 + scrollProgress * 0.6})`,
          transition: "transform 0.5s ease-out, opacity 0.5s ease-out",
          background:
            "radial-gradient(circle, rgba(200, 200, 200, 0.06), rgba(70, 70, 70, 0.02))",
        }}
      />

      <Header />
      <div className="container py-8" ref={contentRef}>
        {data && (
          <>
            <div className="mb-20 max-w-3xl mx-auto relative">
              <div className="flex items-center justify-between mb-4">
                <Link href="/prepare">
                  <ArrowLeftCircle className="mr-2 h-9 w-9 text-5xl" />
                </Link>
              </div>

              <h1
                className="text-4xl md:text-5xl font-bold mb-2 prepare-animate-title text-gray-100"
                style={{
                  ...getTextColorStyle(),
                  opacity: Math.min(1, scrollProgress * 4 + 0.2),
                  transform: `translateY(${Math.max(
                    0,
                    (1 - scrollProgress * 3) * 30
                  )}px)`,
                }}
              >
                {data.title.includes(":")
                  ? data.title.split(":")[0]
                  : data.title}
              </h1>

              {data.title.includes(":") && (
                <p
                  className="text-2xl md:text-3xl font-medium mb-6 prepare-animate-title text-gray-300"
                  style={{
                    ...getTextColorStyle(0.05),
                    opacity: Math.min(1, scrollProgress * 4 + 0.1),
                    transform: `translateY(${Math.max(
                      0,
                      (1 - scrollProgress * 3) * 30
                    )}px)`,
                  }}
                >
                  {data.title.split(":")[1].trim()}
                </p>
              )}

              <p
                className="text-lg mb-8 prepare-animate-description text-gray-300"
                style={{
                  ...getTextColorStyle(),
                  opacity: Math.min(1, scrollProgress * 4),
                  transform: `translateY(${Math.max(
                    0,
                    (1 - scrollProgress * 3) * 30
                  )}px)`,
                }}
              >
                {data.description}
              </p>

              {/* Scroll indicator */}
              <div
                className="hidden md:flex flex-col items-center absolute -bottom-16 left-1/2 transform -translate-x-1/2"
                style={{
                  ...getTextColorStyle(),
                  opacity: Math.max(0, 0.8 - scrollProgress * 2),
                }}
              >
                <span className="text-sm mb-2">Scroll to explore</span>
                <ChevronDown className="h-5 w-5 animate-bounce" />
              </div>

              {/* Adjusted decorative elements for dark theme */}
              <div
                className="absolute top-40 right-10 w-40 h-40 rounded-full blur-[80px] bg-gray-300/5 -z-10"
                style={{
                  ...getFadeStyle(0.1, 0.3),
                  opacity: 0.1 + scrollProgress * 0.2,
                }}
              />
              <div
                className="absolute top-80 left-20 w-60 h-60 rounded-full blur-[100px] bg-gray-400/5 -z-10"
                style={{
                  ...getFadeStyle(0.2, 0.4),
                  opacity: 0.1 + scrollProgress * 0.15,
                }}
              />
            </div>

            {/* Sticky search bar */}
            <div
              className="sticky top-5 z-50 mb-8 max-w-3xl mx-auto transition-all duration-300"
              style={{
                opacity: Math.min(1, scrollProgress * 5 + 0.2),
                transform:
                  scrollProgress > 0.05 ? "translateY(0)" : "translateY(-100%)",
              }}
            >
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search this guide..."
                  className="pl-10 py-2 h-10 w-full bg-black/70 border-gray-800/30 text-gray-200 placeholder:text-gray-500 shadow-lg backdrop-blur-md rounded-lg"
                  value={searchTerm}
                  onChange={(e) => {
                    console.log("Search input changed:", e.target.value);
                    setSearchTerm(e.target.value);
                  }}
                />
                {searchTerm.trim() !== "" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-white"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
              {/* Left column - Table of contents */}
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <Card className="bg-black/30 border-gray-800/30 backdrop-filter backdrop-blur-sm border transition-all duration-300 shadow-xl">
                    <CardContent className="p-6">
                      <h2
                        className="text-xl font-semibold mb-4 flex items-center justify-between"
                        style={getTextColorStyle()}
                      >
                        <div className="flex items-center">
                          <BookOpen
                            className="mr-2 h-5 w-5"
                            style={getTextColorStyle()}
                          />
                          <span>Contents</span>
                        </div>
                        {searchTerm.trim() !== "" && (
                          <span className="text-sm text-gray-400">
                            {filteredSections.length} of {data.sections.length}
                          </span>
                        )}
                      </h2>
                      <nav className="space-y-1">
                        {data.sections.map((section, index) => {
                          // Check if this section is in our filtered results
                          const isVisible =
                            !searchTerm.trim() ||
                            filteredSections.some(
                              (s) => s.title === section.title
                            );

                          return (
                            <a
                              key={index}
                              href={`#section-${index}`}
                              className={cn(
                                "block p-2 rounded-md transition-colors hover:bg-gray-900/50",
                                searchTerm.trim() !== "" &&
                                  !isVisible &&
                                  "opacity-40 line-through"
                              )}
                              style={getTextColorStyle(index * 0.1)}
                              onClick={() => {
                                // If this section isn't visible due to filtering, clear search when clicked
                                if (!isVisible) {
                                  setSearchTerm("");
                                }
                              }}
                            >
                              {section.title}
                            </a>
                          );
                        })}
                      </nav>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right columns - Content sections */}
              <div className="lg:col-span-2 space-y-12">
                {searchTerm.trim() !== "" && filteredSections.length === 0 ? (
                  <div className="bg-black/30 border border-gray-800/50 rounded-lg p-8 text-center">
                    <h3 className="text-xl text-gray-300 mb-2">
                      No sections found matching "{searchTerm}"
                    </h3>
                    <p className="text-gray-400">
                      Try a different search term or clear your search
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 border-gray-700 text-gray-300"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </Button>
                  </div>
                ) : (
                  <>
                    {filteredSections.map((section, originalIndex) => {
                      // Find the original index in the unfiltered array for correct ID anchors
                      const index = data.sections.findIndex(
                        (s) => s.title === section.title
                      );
                      return (
                        <div
                          key={index}
                          id={`section-${index}`}
                          className="scroll-mt-20"
                          style={getFadeStyle(
                            0.1 + index * 0.1,
                            0.25 + index * 0.1
                          )}
                        >
                          <h2
                            className="text-2xl font-bold mb-4"
                            style={getTextColorStyle(index * 0.1)} // Staggered effect
                          >
                            {section.title}
                          </h2>
                          <Card className="bg-black/40 border-gray-800/30 backdrop-filter backdrop-blur-sm border transition-all duration-300">
                            <CardContent className="p-6 prose prose-invert max-w-none">
                              <div
                                style={getTextColorStyle(index * 0.1 + 0.05)}
                              >
                                <ReactMarkdown>{section.content}</ReactMarkdown>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Resources section */}
                {data.resources && data.resources.length > 0 && (
                  <div className="mt-16" style={getFadeStyle(0.7, 0.9)}>
                    <h2
                      className="text-2xl font-bold mb-4"
                      style={getTextColorStyle(0.8)} // Later effect
                    >
                      Additional Resources
                    </h2>
                    <Card className="border-blue-900 backdrop-filter backdrop-blur-sm border transition-all duration-300">
                      <CardContent className="p-6">
                        <ul className="space-y-2">
                          {data.resources.map((resource, index) => (
                            <li key={index}>
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center hover:underline transition-all duration-300 text-blue-400 hover:text-blue-300"
                                style={getTextColorStyle(0.8 + index * 0.05)}
                              >
                                {resource.title}
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
            {/* Quiz Section */}
            {data.is_module && data.questions && (
              <div
                className="mt-16 p-8"
                style={getFadeStyle(0.7, 0.9)}
                ref={quizRef}
              >
                <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setIsQuizOpen(true)}
                      className="bg-blue-200 text-lg text-primary-foreground hover:bg-blue-900/90 hover:text-white w-full"
                    >
                      Take Quiz
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-screen max-w-full h-screen md:max-w-3xl md:h-auto m-0 p-0 text-white rounded-none md:rounded-2xl flex flex-col">
                    {isQuizCompleted ? (
                      <div className="p-6 text-center">
                        <h2 className="text-3xl font-bold mb-4">
                          {quizResults.percentageCorrect === 100
                            ? "Congratulations!"
                            : "Quiz Results"}
                        </h2>
                        <p className="text-xl mb-6">
                          You got {quizResults.correctAnswers} out of{" "}
                          {quizResults.totalQuestions} questions correct (
                          {quizResults.percentageCorrect.toFixed(2)}%)
                        </p>
                        {quizResults.percentageCorrect < 100 ? (
                          <Button
                            onClick={() => setIsQuizCompleted(false)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-full"
                          >
                            Try Again
                          </Button>
                        ) : (
                          <p className="text-lg">
                            Well done on completing the quiz!
                          </p>
                        )}
                        <Button
                          onClick={handleModalClose}
                          className="mt-4 bg-green-500 text-white px-4 py-2 rounded-full"
                        >
                          Close
                        </Button>
                      </div>
                    ) : (
                      <div className="p-6">
                        {/* Progress bar */}
                        <div className="flex justify-center gap-2 mb-6">
                          {[...Array(quizQuestions?.length || 4)].map(
                            (_, index) => (
                              <div
                                key={index}
                                className={`w-6 h-2 rounded-full ${
                                  index < currentQuestion
                                    ? "bg-white"
                                    : "bg-white/30"
                                }`}
                              ></div>
                            )
                          )}
                        </div>

                        {/* Question content */}
                        <div className="mb-6">
                          {quizQuestions?.[currentQuestion]?.image && (
                            <img
                              src="/placeholder-image.svg"
                              alt="Illustration"
                              className="w-24 h-24 mx-auto mb-4"
                            />
                          )}
                          <p className="text-xl font-bold text-center">
                            {quizQuestions?.[currentQuestion]?.question}
                          </p>
                        </div>

                        {/* Answer options */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          {quizQuestions?.[currentQuestion]?.options.map(
                            (option, i) => {
                              const letter = String.fromCharCode(65 + i); // A, B, C, D
                              const isSelected =
                                selectedOptions[currentQuestion] === option;

                              return (
                                <button
                                  key={i}
                                  onClick={() => handleOptionSelect(option)}
                                  className={`flex items-center justify-center px-4 py-3 rounded-full font-semibold transition-all ${
                                    isSelected
                                      ? "bg-yellow-400 text-black"
                                      : "bg-white text-black"
                                  }`}
                                >
                                  <span className="mr-2">{letter}.</span>{" "}
                                  {option}
                                </button>
                              );
                            }
                          )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center">
                          <button
                            onClick={goToPrevious}
                            className="bg-white/20 text-white rounded-full px-5 py-2"
                            disabled={currentQuestion === 0}
                          >
                            <ArrowLeftCircle className="w-4 h-4 mr-2 h-9 w-9 text-5xl" />
                          </button>
                          <button
                            onClick={goToNext}
                            className="bg-white text-green-800 rounded-full px-5 py-2 font-semibold"
                          >
                            <ArrowRightCircle className="w-4 h-4 mr-2 h-9 w-9 text-5xl" />
                          </button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}
