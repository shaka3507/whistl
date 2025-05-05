"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const { user, isAdmin } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full min-h-[80vh] flex items-center justify-center py-4 md:py-16 lg:py-8 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-4xl">
                  whistl
                </h1>
                <div className="flex justify-center my-4">
                  <svg fill="#f5f5f5" height="100px" width="100px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 309.297 309.297" xmlSpace="preserve" stroke="#f5f5f5">
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path d="M286.539,107.345c-11.194-10.98-25.113-17.665-39.723-20.11c0.778-0.717,1.549-1.452,2.309-2.212 c7.586-7.586,13.248-16.354,15.943-24.688c3.247-10.042,1.979-18.629-3.571-24.178c-3.48-3.481-8.305-5.321-13.95-5.321 c-10.786,0-23.839,6.614-34.917,17.692c-12.785,12.786-19.048,27.472-17.402,38.506h-22.273c-17.356,0-33.674,6.759-45.948,19.031 L2.399,230.672c-0.067,0.063-0.137,0.118-0.203,0.183c-2.929,2.93-2.929,7.678,0,10.607L37,276.266 c1.413,1.413,3.324,2.196,5.303,2.196c0.24,0,0.48-0.012,0.722-0.035l60.378-5.832c0.326-0.031,0.65-0.09,0.971-0.163 c0.07-0.016,0.14-0.033,0.209-0.051c0.613-0.159,1.209-0.396,1.774-0.712c0.06-0.034,0.119-0.07,0.178-0.105 c0.226-0.135,0.445-0.282,0.659-0.442c0.05-0.038,0.103-0.073,0.152-0.112c0.226-0.179,0.446-0.369,0.655-0.577 c0.017-0.017,0.03-0.035,0.047-0.052c0.043-0.044,0.082-0.092,0.125-0.138c0.18-0.193,0.348-0.392,0.504-0.599 c0.049-0.064,0.096-0.128,0.143-0.194c0.38-0.538,0.682-1.112,0.904-1.712c0.01-0.026,0.024-0.05,0.034-0.076 c0.012-0.033,0.017-0.067,0.028-0.101c0.099-0.288,0.183-0.58,0.245-0.876c0.006-0.026,0.014-0.052,0.019-0.079 c0.062-0.31,0.1-0.622,0.122-0.936c0.006-0.079,0.008-0.156,0.011-0.234c0.011-0.266,0.009-0.531-0.009-0.796 c-0.003-0.053-0.003-0.105-0.008-0.158c-0.027-0.311-0.075-0.619-0.141-0.925c-0.013-0.061-0.03-0.121-0.045-0.182 c-0.064-0.265-0.142-0.527-0.234-0.785c-0.018-0.05-0.034-0.101-0.053-0.151c-0.115-0.299-0.248-0.592-0.402-0.877 c-0.019-0.036-0.042-0.069-0.062-0.105c-0.136-0.242-0.288-0.476-0.453-0.705c-0.046-0.064-0.092-0.128-0.141-0.191 c-0.196-0.254-0.403-0.501-0.636-0.734L78.5,230.327L188.828,120c9.834-9.834,22.076-15.834,34.741-17.967h20.946 c11.608,1.983,22.642,7.311,31.521,16.021c12.387,12.15,19.019,29.062,18.193,46.396c-0.837,17.574-8.898,33.406-22.7,44.581 c-18.815,15.232-45.84,17.619-67.253,5.935l-0.595-0.329c-23.434-13.113-51.65-9.45-70.212,9.113l-10.125,10.125 c-2.929,2.929-2.929,7.678,0,10.606c2.928,2.929,7.677,2.93,10.606,0.001l10.125-10.126c13.761-13.762,34.771-16.427,52.288-6.626 l0.732,0.405c26.681,14.558,60.387,11.567,83.872-7.446c16.922-13.701,27.217-33.939,28.245-55.525 C310.24,143.562,301.976,122.487,286.539,107.345z M210.866,86.788c-2.694-2.694-0.043-15.24,12.371-27.654 c9.186-9.187,18.829-13.299,24.311-13.299c0.902,0,2.537,0.121,3.343,0.928c1.054,1.054,1.433,4.231-0.095,8.956 c-1.95,6.029-6.424,12.845-12.277,18.697c-7.064,7.064-14.391,11.117-19.895,12.617h-7.452 C211.061,86.959,210.957,86.879,210.866,86.788z M148.111,139.503h-19.464c-4.142,0-7.5,3.357-7.5,7.5s3.358,7.5,7.5,7.5h4.464 l-68.618,68.618l-23.293,2.249c-4.123,0.397-7.143,4.063-6.745,8.186s4.062,7.16,8.186,6.744l22.452-2.167l1.085,1.085 l19.974,19.973l-41.047,3.965l-26.987-26.987l119.497-119.497c9.44-9.44,21.991-14.639,35.341-14.639h13.755 c-2.957,2.224-5.799,4.67-8.488,7.359L148.111,139.503z"></path>
                    </g>
                  </svg>
                </div>
                <div className="mt-4">an emergency response platform</div>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  sound the alarm, secure your team.
                </p>
              </div>
              <div className="space-x-4">
                {user ? (
                  <>
                    {isAdmin ? (
                      <Link href="/admin">
                        <Button size="lg" className="bg-primary">
                          Alert
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/channels">
                        <Button size="lg" className="bg-primary">
                          Get help
                        </Button>
                      </Link>
                    )}
                    <Link href="/prepare">
                      <Button variant="outline" size="lg">
                        Prepare
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button size="lg" className="bg-primary">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg">
                        Log In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-3 md:py-2">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 whistl response. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}