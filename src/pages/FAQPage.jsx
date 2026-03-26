import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const FAQPage = () => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const faqs = [
    {
      question: 'What makes AnfaStyles eco-conscious?',
      answer: 'We use sustainable materials, eco-friendly printing processes, and partner with manufacturers who share our commitment to reducing environmental impact. Every product is made-to-order to minimize waste.'
    },
    {
      question: 'How does print-on-demand work?',
      answer: 'When you place an order, we create your item specifically for you. This eliminates excess inventory and waste. Your product is printed, packaged, and shipped directly to you within 3-7 business days.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day satisfaction guarantee. If you are not completely satisfied with your purchase, contact us for a full refund or exchange. Custom items must be unworn and in original condition.'
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship worldwide. Shipping costs and delivery times vary by location. Free shipping applies to US orders over $75 only.'
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 5-7 business days within the US. Express shipping (2-3 business days) is available for an additional fee. International orders typically arrive within 10-14 business days.'
    },
    {
      question: 'What materials do you use?',
      answer: 'We use organic cotton, recycled polyester, bamboo fabric, and other sustainable materials. All our fabrics are sourced from certified eco-friendly suppliers.'
    },
    {
      question: 'Can I track my order?',
      answer: 'Yes, once your order ships, you will receive a tracking number via email. You can also track your order status in your account dashboard.'
    },
    {
      question: 'Do you offer wholesale or bulk orders?',
      answer: 'Yes, we offer wholesale pricing for bulk orders. Please contact us at contact@medaitllc.com with your requirements for a custom quote.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - AnfaStyles</title>
        <meta name="description" content="Frequently asked questions about AnfaStyles products, shipping, and sustainability" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance" style={{ letterSpacing: '-0.02em' }}>
              Frequently asked questions
            </h1>
            <p className="text-lg text-muted-foreground">Find answers to common questions about our products and services</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default FAQPage;
